#!/usr/bin/env python3
"""Render a light street basemap of central Shanghai from an Overpass JSON extract.

Tiles are a Produced Work from OpenStreetMap data (ODbL). The site attributes
OpenStreetMap contributors in the map. This does not download OSMF tile PNGs.

Coverage constants must match docs/js/basemap.js.
"""

from __future__ import annotations

import argparse
import json
import math
import multiprocessing as mp
import os
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SOUTH, WEST, NORTH, EAST = 31.12, 121.33, 31.31, 121.59
MIN_Z, MAX_Z = 11, 16
SCALE = 2
TILE = 256
CELL = 0.01

LAND = (236, 233, 226)
WATER = (186, 214, 228)
SHORE = (146, 178, 198)
PARK = (206, 220, 196)
ROAD = (255, 255, 255)
CASING = (206, 199, 188)
MAJOR = (255, 251, 246)
RAIL = (168, 160, 148)
LABEL = (74, 68, 60)
WATER_LABEL = (62, 102, 122)
HALO = (255, 254, 250)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
]

ROAD_RANK = {
    "residential": 1,
    "living_street": 1,
    "pedestrian": 1,
    "road": 1,
    "unclassified": 2,
    "tertiary": 3,
    "tertiary_link": 3,
    "secondary": 4,
    "secondary_link": 4,
    "primary": 5,
    "primary_link": 4,
    "trunk": 6,
    "trunk_link": 5,
    "motorway": 7,
    "motorway_link": 6,
}

# Final-pixel stroke width by zoom and rank. 0 means skip.
ROAD_WIDTH = {
    11: {7: 2.2, 6: 1.8, 5: 1.5},
    12: {7: 2.8, 6: 2.4, 5: 2.0, 4: 1.5},
    13: {7: 3.6, 6: 3.2, 5: 2.6, 4: 2.0, 3: 1.6, 2: 1.15, 1: 1.0},
    14: {7: 4.4, 6: 4.0, 5: 3.3, 4: 2.6, 3: 2.0, 2: 1.4, 1: 1.2},
    15: {7: 5.4, 6: 4.8, 5: 4.0, 4: 3.2, 3: 2.5, 2: 1.8, 1: 1.5},
    16: {7: 6.4, 6: 5.6, 5: 4.8, 4: 3.8, 3: 3.0, 2: 2.2, 1: 1.8},
}

FEATURES: list = []
INDEX: dict = {}
LABELS: dict = {}
FONT_PATH = ""


def clamp_lat(lat: float) -> float:
    return max(-85.0, min(85.0, lat))


def lon_to_x(lon: float, z: int) -> int:
    return int((lon + 180.0) / 360.0 * (1 << z))


def lat_to_y(lat: float, z: int) -> int:
    lat = clamp_lat(lat)
    latr = math.radians(lat)
    merc = math.log(math.tan(latr) + 1.0 / math.cos(latr))
    return int((1.0 - merc / math.pi) / 2.0 * (1 << z))


def world_px(lat: float, lon: float, z: int) -> tuple[float, float]:
    n = float(1 << z)
    x = (lon + 180.0) / 360.0 * n
    latr = math.radians(clamp_lat(lat))
    y = (1.0 - math.log(math.tan(latr) + 1.0 / math.cos(latr)) / math.pi) / 2.0 * n
    return x * TILE * SCALE, y * TILE * SCALE


def geom_pts(geom) -> list[tuple[float, float]]:
    out = []
    for p in geom or []:
        if not isinstance(p, dict) or "lat" not in p or "lon" not in p:
            continue
        pt = (float(p["lat"]), float(p["lon"]))
        if out and abs(pt[0] - out[-1][0]) < 1e-8 and abs(pt[1] - out[-1][1]) < 1e-8:
            continue
        out.append(pt)
    return out


def closed(pts, tol=1e-5) -> bool:
    return len(pts) >= 4 and abs(pts[0][0] - pts[-1][0]) <= tol and abs(pts[0][1] - pts[-1][1]) <= tol


def bbox_of(pts) -> tuple[float, float, float, float]:
    lats = [p[0] for p in pts]
    lons = [p[1] for p in pts]
    return min(lats), min(lons), max(lats), max(lons)


def stitch(lines, tol=1e-5):
    pending = [list(line) for line in lines if len(line) >= 2]
    rings = []
    while pending:
        ring = pending.pop()
        progressed = True
        while progressed and not closed(ring, tol):
            progressed = False
            for i, line in enumerate(pending):
                if abs(ring[-1][0] - line[0][0]) <= tol and abs(ring[-1][1] - line[0][1]) <= tol:
                    ring.extend(line[1:])
                elif abs(ring[-1][0] - line[-1][0]) <= tol and abs(ring[-1][1] - line[-1][1]) <= tol:
                    ring.extend(list(reversed(line[:-1])))
                elif abs(ring[0][0] - line[-1][0]) <= tol and abs(ring[0][1] - line[-1][1]) <= tol:
                    ring = line[:-1] + ring
                elif abs(ring[0][0] - line[0][0]) <= tol and abs(ring[0][1] - line[0][1]) <= tol:
                    ring = list(reversed(line[1:])) + ring
                else:
                    continue
                pending.pop(i)
                progressed = True
                break
        rings.append(ring)
    return rings


def is_water(tags: dict) -> bool:
    if tags.get("natural") == "water":
        return True
    if tags.get("waterway") in ("riverbank", "dock"):
        return True
    if tags.get("landuse") in ("reservoir", "basin"):
        return True
    return False


def is_park(tags: dict) -> bool:
    if tags.get("leisure") in ("park", "garden", "pitch", "golf_course", "nature_reserve"):
        return True
    if tags.get("landuse") in ("park", "grass", "forest", "meadow", "recreation_ground", "village_green"):
        return True
    if tags.get("natural") in ("wood", "grassland"):
        return True
    return False


def add_feature(feat: dict) -> None:
    pts = []
    for ring in feat.get("rings") or []:
        pts.extend(ring)
    pts.extend(feat.get("line") or [])
    if len(pts) < 2:
        return
    feat["bbox"] = bbox_of(pts)
    FEATURES.append(feat)
    minlat, minlon, maxlat, maxlon = feat["bbox"]
    x0 = int(math.floor(minlon / CELL))
    x1 = int(math.floor(maxlon / CELL))
    y0 = int(math.floor(minlat / CELL))
    y1 = int(math.floor(maxlat / CELL))
    for cy in range(y0, y1 + 1):
        for cx in range(x0, x1 + 1):
            INDEX.setdefault((cx, cy), []).append(feat)


def parse(path: Path) -> None:
    data = json.loads(path.read_text())
    elements = data.get("elements") or []
    for el in elements:
        tags = el.get("tags") or {}
        if el.get("type") == "way":
            pts = geom_pts(el.get("geometry"))
            if len(pts) < 2:
                continue
            if tags.get("tunnel") == "yes":
                continue
            if tags.get("highway") in ROAD_RANK:
                add_feature({"kind": "road", "cls": tags["highway"], "line": pts, "name": tags.get("name") or "", "minzoom": 11})
            elif is_water(tags) and closed(pts):
                add_feature({"kind": "water", "rings": [pts], "holes": [], "name": tags.get("name") or "", "minzoom": 11})
            elif tags.get("waterway") in ("river", "canal", "stream", "dock"):
                add_feature({"kind": "waterway", "cls": tags.get("waterway"), "line": pts, "name": tags.get("name") or "", "minzoom": 11})
            elif is_park(tags) and closed(pts):
                add_feature({
                    "kind": "park",
                    "pitch": tags.get("leisure") == "pitch",
                    "rings": [pts],
                    "minzoom": 15 if tags.get("leisure") == "pitch" else 11,
                })
            elif tags.get("railway") in ("rail", "light_rail", "tram", "subway") and tags.get("tunnel") != "yes":
                add_feature({"kind": "rail", "cls": tags["railway"], "line": pts, "minzoom": 15 if tags.get("railway") == "subway" else 12})
        elif el.get("type") == "relation":
            outers, inners = [], []
            for mem in el.get("members") or []:
                if mem.get("type") != "way":
                    continue
                pts = geom_pts(mem.get("geometry"))
                if len(pts) < 2:
                    continue
                role = mem.get("role") or "outer"
                (inners if role == "inner" else outers).append(pts)
            if not outers:
                continue
            if is_water(tags):
                rings = stitch(outers)
                holes = [r for r in stitch(inners) if closed(r)]
                polys = [r for r in rings if closed(r)]
                for ring in polys:
                    add_feature({"kind": "water", "rings": [ring], "holes": holes, "name": tags.get("name") or "", "minzoom": 11})
                for ring in rings:
                    if not closed(ring):
                        add_feature({"kind": "waterway", "cls": "river", "line": ring, "name": "", "minzoom": 11})
            elif is_park(tags):
                pitch = tags.get("leisure") == "pitch"
                for ring in stitch(outers):
                    if closed(ring):
                        add_feature({"kind": "park", "pitch": pitch, "rings": [ring], "minzoom": 15 if pitch else 11})


def road_width(cls: str, z: int) -> float:
    rank = ROAD_RANK.get(cls, 0)
    return ROAD_WIDTH.get(z, {}).get(rank, 0.0)


def query(bbox) -> list:
    minlat, minlon, maxlat, maxlon = bbox
    pad = 0.004
    seen = []
    ids = set()
    x0 = int(math.floor((minlon - pad) / CELL))
    x1 = int(math.floor((maxlon + pad) / CELL))
    y0 = int(math.floor((minlat - pad) / CELL))
    y1 = int(math.floor((maxlat + pad) / CELL))
    for cy in range(y0, y1 + 1):
        for cx in range(x0, x1 + 1):
            for feat in INDEX.get((cx, cy), []):
                fid = id(feat)
                if fid in ids:
                    continue
                fb = feat["bbox"]
                if fb[2] < minlat - pad or fb[0] > maxlat + pad or fb[3] < minlon - pad or fb[1] > maxlon + pad:
                    continue
                ids.add(fid)
                seen.append(feat)
    return seen


def tile_bbox(z: int, x: int, y: int):
    n = float(1 << z)
    west = x / n * 360.0 - 180.0
    east = (x + 1) / n * 360.0 - 180.0

    def lat_at(yy: float) -> float:
        t = math.pi * (1 - 2 * yy / n)
        return math.degrees(math.atan(math.sinh(t)))

    north = lat_at(y)
    south = lat_at(y + 1)
    return south, west, north, east


def to_local(lat, lon, z, tx, ty):
    wx, wy = world_px(lat, lon, z)
    return wx - tx * TILE * SCALE, wy - ty * TILE * SCALE


def clip_segment(x0, y0, x1, y1, xmin, ymin, xmax, ymax):
    INSIDE, LEFT, RIGHT, BOTTOM, TOP = 0, 1, 2, 4, 8

    def code(x, y):
        c = INSIDE
        if x < xmin:
            c |= LEFT
        elif x > xmax:
            c |= RIGHT
        if y < ymin:
            c |= BOTTOM
        elif y > ymax:
            c |= TOP
        return c

    c0, c1 = code(x0, y0), code(x1, y1)
    for _ in range(12):
        if not (c0 | c1):
            return (x0, y0, x1, y1)
        if c0 & c1:
            return None
        c = c0 or c1
        if c & TOP:
            if y1 == y0:
                return None
            x = x0 + (x1 - x0) * (ymax - y0) / (y1 - y0)
            y = ymax
        elif c & BOTTOM:
            if y1 == y0:
                return None
            x = x0 + (x1 - x0) * (ymin - y0) / (y1 - y0)
            y = ymin
        elif c & RIGHT:
            if x1 == x0:
                return None
            y = y0 + (y1 - y0) * (xmax - x0) / (x1 - x0)
            x = xmax
        else:
            if x1 == x0:
                return None
            y = y0 + (y1 - y0) * (xmin - x0) / (x1 - x0)
            x = xmin
        if c == c0:
            x0, y0, c0 = x, y, code(x, y)
        else:
            x1, y1, c1 = x, y, code(x, y)
    return None


def clip_polygon(poly, xmin, ymin, xmax, ymax):
    def clip(poly, inside, intersect):
        if not poly:
            return []
        out = []
        prev = poly[-1]
        prev_in = inside(prev)
        for cur in poly:
            cur_in = inside(cur)
            if cur_in:
                if not prev_in:
                    out.append(intersect(prev, cur))
                out.append(cur)
            elif prev_in:
                out.append(intersect(prev, cur))
            prev = cur
            prev_in = cur_in
        return out

    def ix(a, b, x):
        if a[0] == b[0]:
            return (x, a[1])
        t = (x - a[0]) / (b[0] - a[0])
        return (x, a[1] + t * (b[1] - a[1]))

    def iy(a, b, y):
        if a[1] == b[1]:
            return (a[0], y)
        t = (y - a[1]) / (b[1] - a[1])
        return (a[0] + t * (b[0] - a[0]), y)

    poly = clip(poly, lambda p: p[0] >= xmin, lambda a, b: ix(a, b, xmin))
    poly = clip(poly, lambda p: p[0] <= xmax, lambda a, b: ix(a, b, xmax))
    poly = clip(poly, lambda p: p[1] >= ymin, lambda a, b: iy(a, b, ymin))
    poly = clip(poly, lambda p: p[1] <= ymax, lambda a, b: iy(a, b, ymax))
    return poly


def draw_line(draw, pts, color, width, margin):
    if width < 1 or len(pts) < 2:
        return
    size = TILE * SCALE
    xmin, ymin, xmax, ymax = -margin, -margin, size + margin, size + margin
    r = width / 2.0
    for i in range(len(pts) - 1):
        seg = clip_segment(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], xmin, ymin, xmax, ymax)
        if not seg:
            continue
        draw.line([(seg[0], seg[1]), (seg[2], seg[3])], fill=color, width=max(1, int(round(width))))
        if width >= 3 * SCALE / 2:
            for x, y in ((seg[0], seg[1]), (seg[2], seg[3])):
                draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def line_pixels(feat, z, tx, ty):
    return [to_local(lat, lon, z, tx, ty) for lat, lon in feat["line"]]


def ring_pixels(ring, z, tx, ty):
    return [to_local(lat, lon, z, tx, ty) for lat, lon in ring]


def draw_poly(draw, pts, fill):
    if len(pts) < 3:
        return
    size = TILE * SCALE
    clipped = clip_polygon(pts, -4, -4, size + 4, size + 4)
    if len(clipped) < 3:
        return
    draw.polygon(clipped, fill=fill)


_FONTS = {}


def get_font(px: int):
    if px in _FONTS:
        return _FONTS[px]
    font = None
    if FONT_PATH:
        try:
            font = ImageFont.truetype(FONT_PATH, px)
        except Exception:
            font = None
    _FONTS[px] = font
    return font


def draw_labels(base, z, tx, ty):
    font_px = int(round((10 if z <= 13 else 11 if z <= 15 else 12) * SCALE))
    font = get_font(font_px)
    if font is None:
        return
    size = TILE * SCALE
    origin_x = tx * size
    origin_y = ty * size
    for lb in LABELS.get(z, []):
        cx, cy = lb["world"]
        hw, hh = lb["box"]
        if cx + hw < origin_x or cx - hw > origin_x + size or cy + hh < origin_y or cy - hh > origin_y + size:
            continue
        text = lb["text"]
        fill = WATER_LABEL if lb["kind"] == "water" else LABEL
        halo = HALO
        dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        box = dummy.textbbox((0, 0), text, font=font)
        tw, th = box[2] - box[0] + 8, box[3] - box[1] + 8
        layer = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        td = ImageDraw.Draw(layer)
        ox, oy = 4 - box[0], 4 - box[1]
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            td.text((ox + dx, oy + dy), text, font=font, fill=halo + (235,))
        td.text((ox, oy), text, font=font, fill=fill + (255,))
        angle = lb["angle"]
        if abs(angle) > 8:
            layer = layer.rotate(-angle, expand=True, resample=Image.Resampling.BICUBIC)
        px = int(round(cx - origin_x - layer.width / 2))
        py = int(round(cy - origin_y - layer.height / 2))
        base.paste(layer, (px, py), layer)


def render_tile(z: int, x: int, y: int, out_dir: str) -> str:
    img = Image.new("RGB", (TILE * SCALE, TILE * SCALE), LAND)
    draw = ImageDraw.Draw(img)
    tb = tile_bbox(z, x, y)
    feats = query(tb)
    parks, waters, ways, rails, roads = [], [], [], [], []
    for feat in feats:
        if z < feat.get("minzoom", 11):
            continue
        kind = feat["kind"]
        if kind == "park":
            if feat.get("pitch") and z < 15:
                continue
            area = (feat["bbox"][2] - feat["bbox"][0]) * (feat["bbox"][3] - feat["bbox"][1])
            if z <= 12 and area < 0.00004:
                continue
            if z <= 14 and area < 0.000008 and feat.get("pitch"):
                continue
            parks.append(feat)
        elif kind == "water":
            area = (feat["bbox"][2] - feat["bbox"][0]) * (feat["bbox"][3] - feat["bbox"][1])
            if area < 1e-7 or (z <= 12 and area < 2e-5) or (z == 13 and area < 8e-6):
                continue
            waters.append(feat)
        elif kind == "waterway":
            cls = feat.get("cls")
            if cls == "stream" and z < 14:
                continue
            if cls == "canal" and z < 12:
                continue
            ways.append(feat)
        elif kind == "rail":
            rails.append(feat)
        elif kind == "road":
            if road_width(feat["cls"], z) > 0:
                roads.append(feat)

    for feat in parks:
        for ring in feat["rings"]:
            draw_poly(draw, ring_pixels(ring, z, x, y), PARK)

    shore_w = max(1, int(round(1.6 * SCALE)))
    for feat in waters:
        for ring in feat["rings"]:
            pix = ring_pixels(ring, z, x, y)
            draw_poly(draw, pix, WATER)
            # Stroke the real shoreline only. Outlining the clipped polygon
            # would draw a false edge along every tile boundary.
            draw_line(draw, pix, SHORE, shore_w, margin=12)
        for hole in feat.get("holes") or []:
            pix = ring_pixels(hole, z, x, y)
            draw_poly(draw, pix, LAND)
            draw_line(draw, pix, SHORE, shore_w, margin=12)

    for feat in ways:
        cls = feat.get("cls")
        width = {"river": 3.2, "canal": 2.0, "dock": 2.4, "stream": 1.2}.get(cls, 1.6)
        width = width * (1.15 ** (z - 13)) * SCALE
        draw_line(draw, line_pixels(feat, z, x, y), WATER, width, margin=20)

    for feat in rails:
        width = (1.2 if z < 14 else 1.6 if z < 16 else 2.0) * SCALE
        draw_line(draw, line_pixels(feat, z, x, y), RAIL, width, margin=12)

    roads.sort(key=lambda f: ROAD_RANK.get(f["cls"], 0))
    prepared = []
    for feat in roads:
        w = road_width(feat["cls"], z) * SCALE
        prepared.append((feat, w, line_pixels(feat, z, x, y)))
    for feat, w, pts in prepared:
        extra = 2.2 * SCALE if w >= 2.2 * SCALE else (1.4 * SCALE if w >= 1.6 * SCALE else 0)
        if extra:
            draw_line(draw, pts, CASING, w + extra, margin=24)
    for feat, w, pts in prepared:
        color = MAJOR if ROAD_RANK.get(feat["cls"], 0) >= 6 else ROAD
        draw_line(draw, pts, color, w, margin=24)

    draw_labels(img, z, x, y)

    small = img.resize((TILE, TILE), Image.Resampling.LANCZOS)
    # Quantize after downscale. The palette is small; this keeps the repo light.
    small = small.quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    dest = Path(out_dir) / str(z) / str(x) / f"{y}.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    small.save(dest, optimize=True)
    return str(dest)


def render_job(item):
    z, x, y, out_dir = item
    render_tile(z, x, y, out_dir)
    return 1


def build_labels():
    """One label anchor per name, spaced so long roads are not stamped on every segment."""
    raw = {z: [] for z in range(MIN_Z, MAX_Z + 1)}

    def consider(lat, lon, text, kind, rank, angle_pts, minzoom):
        text = (text or "").strip()
        if len(text) < 2 or len(text) > 14:
            return
        if text.replace(" ", "").isdigit():
            return
        if not (SOUTH <= lat <= NORTH and WEST <= lon <= EAST):
            return
        for z in range(max(minzoom, MIN_Z), MAX_Z + 1):
            raw[z].append({"lat": lat, "lon": lon, "text": text, "kind": kind, "rank": rank, "angle_pts": angle_pts})

    for feat in FEATURES:
        if feat["kind"] == "water" and feat.get("name"):
            ring = feat["rings"][0]
            lat = sum(p[0] for p in ring) / len(ring)
            lon = sum(p[1] for p in ring) / len(ring)
            consider(lat, lon, feat["name"], "water", 0, None, 12)
        elif feat["kind"] == "waterway" and feat.get("name") and feat.get("cls") == "river":
            mid = polyline_mid(feat["line"])
            if mid:
                consider(mid[0], mid[1], feat["name"], "water", 0, (mid[2], mid[3]), 13)
        elif feat["kind"] == "road" and feat.get("name"):
            rank = ROAD_RANK.get(feat["cls"], 9)
            if rank < 3 or feat["cls"].endswith("_link"):
                continue
            mid = polyline_mid(feat["line"])
            if not mid:
                continue
            # Skip very short fragments; the longer pieces of the same street still label.
            if mid[4] < 0.0012:
                continue
            minzoom = 14 if rank >= 5 else 15 if rank >= 4 else 16
            consider(mid[0], mid[1], feat["name"], "road", 8 - rank, (mid[2], mid[3]), minzoom)

    for z, items in raw.items():
        items.sort(key=lambda lb: lb["rank"])
        radius = 0.012 if z <= 12 else 0.008 if z <= 13 else 0.005 if z <= 14 else 0.0035
        kept = []
        for lb in items:
            if any(k["text"] == lb["text"] and abs(k["lat"] - lb["lat"]) < radius and abs(k["lon"] - lb["lon"]) < radius * 1.2 for k in kept):
                continue
            if sum(1 for k in kept if abs(k["lat"] - lb["lat"]) < radius * 0.45 and abs(k["lon"] - lb["lon"]) < radius * 0.55) >= 2:
                continue
            wx, wy = world_px(lb["lat"], lb["lon"], z)
            angle = 0.0
            if lb["angle_pts"] and lb["kind"] == "road":
                (lat1, lon1), (lat2, lon2) = lb["angle_pts"]
                x1, y1 = world_px(lat1, lon1, z)
                x2, y2 = world_px(lat2, lon2, z)
                angle = math.degrees(math.atan2(-(y2 - y1), x2 - x1))
                if angle > 90:
                    angle -= 180
                elif angle < -90:
                    angle += 180
            # Axis-aligned extent used for tile overlap. Generous so glyphs aren't cut.
            # Half-extent in supersampled pixels, so a label that crosses a tile edge
            # is painted on every tile it touches and the glyphs line up.
            span = (len(lb["text"]) * 16 + 28) * SCALE
            kept.append({
                "text": lb["text"],
                "kind": lb["kind"],
                "lat": lb["lat"],
                "lon": lb["lon"],
                "world": (wx, wy),
                "angle": angle,
                "box": (span, span * 0.45),
            })
            if len(kept) >= (80 if z <= 12 else 180 if z <= 14 else 420):
                break
        LABELS[z] = kept


def polyline_mid(pts):
    if len(pts) < 2:
        return None
    segs = []
    total = 0.0
    for i in range(len(pts) - 1):
        dlat = pts[i + 1][0] - pts[i][0]
        dlon = (pts[i + 1][1] - pts[i][1]) * math.cos(math.radians(pts[i][0]))
        dist = math.hypot(dlat, dlon)
        segs.append(dist)
        total += dist
    if total <= 0:
        return None
    half = total / 2
    acc = 0.0
    for i, dist in enumerate(segs):
        if acc + dist >= half and dist > 0:
            t = (half - acc) / dist
            lat = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t
            lon = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
            return lat, lon, pts[i], pts[i + 1], total
        acc += dist
    return None


def iter_tiles(z: int):
    x0, x1 = lon_to_x(WEST, z), lon_to_x(EAST, z)
    y0, y1 = lat_to_y(NORTH, z), lat_to_y(SOUTH, z)
    for x in range(min(x0, x1), max(x0, x1) + 1):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            yield z, x, y


def write_sidecars(out: Path) -> None:
    blank = Image.new("RGB", (16, 16), LAND)
    blank.save(out / "blank.png", optimize=True)
    coverage = {
        "south": SOUTH,
        "west": WEST,
        "north": NORTH,
        "east": EAST,
        "minZoom": MIN_Z,
        "maxNativeZoom": MAX_Z,
        "attribution": "© OpenStreetMap contributors",
        "license": "Map tiles rendered from OpenStreetMap data, available under the Open Database License.",
    }
    (out / "coverage.json").write_text(json.dumps(coverage, indent=2) + "\n")
    (out / "COPYING.txt").write_text(
        "Basemap tiles for the Shanghai Millionaire research maps.\n"
        "Rendered from OpenStreetMap data (Geofabrik Shanghai extract).\n"
        "© OpenStreetMap contributors. https://www.openstreetmap.org/copyright\n"
        "OpenStreetMap data is licensed under the Open Database License (ODbL).\n"
        "These tiles are a Produced Work. The map credits OpenStreetMap contributors.\n"
    )


def in_coverage(pts, margin=0.02) -> bool:
    if len(pts) < 2:
        return False
    minlat, minlon, maxlat, maxlon = bbox_of(pts)
    return not (maxlat < SOUTH - margin or minlat > NORTH + margin or maxlon < WEST - margin or minlon > EAST + margin)


def node_pts(nodes) -> list[tuple[float, float]]:
    import osmium
    pts = []
    try:
        for n in nodes:
            if not n.location.valid():
                continue
            pt = (n.lat, n.lon)
            if pts and abs(pt[0] - pts[-1][0]) < 1e-8 and abs(pt[1] - pts[-1][1]) < 1e-8:
                continue
            pts.append(pt)
    except osmium.InvalidLocationError:
        return []
    return pts


def close_ring(pts):
    if len(pts) >= 3 and not closed(pts):
        pts = pts + [pts[0]]
    return pts


def parse_pbf(path: Path) -> None:
    import osmium

    class Collector(osmium.SimpleHandler):
        def way(self, w):
            tags = {t.k: t.v for t in w.tags}
            if tags.get("tunnel") == "yes":
                return
            if tags.get("highway") in ROAD_RANK:
                pts = node_pts(w.nodes)
                if len(pts) >= 2 and in_coverage(pts):
                    add_feature({"kind": "road", "cls": tags["highway"], "line": pts, "name": tags.get("name") or "", "minzoom": 11})
                return
            if tags.get("waterway") in ("river", "canal", "stream", "dock"):
                pts = node_pts(w.nodes)
                if len(pts) >= 2 and in_coverage(pts):
                    add_feature({"kind": "waterway", "cls": tags["waterway"], "line": pts, "name": tags.get("name") or "", "minzoom": 11})
                return
            if tags.get("railway") in ("rail", "light_rail", "tram", "subway"):
                pts = node_pts(w.nodes)
                if len(pts) >= 2 and in_coverage(pts):
                    add_feature({
                        "kind": "rail",
                        "cls": tags["railway"],
                        "line": pts,
                        "minzoom": 15 if tags.get("railway") == "subway" else 12,
                    })

        def area(self, a):
            tags = {t.k: t.v for t in a.tags}
            water, park = is_water(tags), is_park(tags)
            if not water and not park:
                return
            try:
                outers = list(a.outer_rings())
            except osmium.InvalidLocationError:
                return
            for outer in outers:
                ring = close_ring(node_pts(outer))
                if not closed(ring) or not in_coverage(ring):
                    continue
                holes = []
                try:
                    inners = list(a.inner_rings(outer))
                except osmium.InvalidLocationError:
                    inners = []
                for inner in inners:
                    hole = close_ring(node_pts(inner))
                    if closed(hole):
                        holes.append(hole)
                if water:
                    add_feature({"kind": "water", "rings": [ring], "holes": holes, "name": tags.get("name") or "", "minzoom": 11})
                else:
                    add_feature({
                        "kind": "park",
                        "pitch": tags.get("leisure") == "pitch",
                        "rings": [ring],
                        "minzoom": 15 if tags.get("leisure") == "pitch" else 11,
                    })

    collector = Collector()
    collector.apply_file(str(path), locations=True)


def main():
    global FONT_PATH
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="/tmp/osm-shanghai.json")
    ap.add_argument("--out", default="docs/vendor/tiles")
    ap.add_argument("--zooms", default="11-16")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--workers", type=int, default=max(1, min(4, os.cpu_count() or 2)))
    args = ap.parse_args()

    for cand in FONT_CANDIDATES:
        if Path(cand).exists():
            FONT_PATH = cand
            break
    print("font", FONT_PATH or "NONE")

    data_path = Path(args.data)
    print("loading", data_path)
    if data_path.suffix == ".pbf":
        parse_pbf(data_path)
    else:
        parse(data_path)
    kinds = {}
    for feat in FEATURES:
        kinds[feat["kind"]] = kinds.get(feat["kind"], 0) + 1
    print("features", len(FEATURES), kinds)
    build_labels()
    for z, labs in sorted(LABELS.items()):
        print(f"labels z{z}", len(labs))

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    write_sidecars(out)

    if args.preview:
        samples = [
            (14, 31.238, 121.490, "bund"),
            (15, 31.252, 121.494, "hongkou"),
            (14, 31.216, 121.446, "concession"),
            (13, 31.22, 121.42, "west"),
            (12, 31.23, 121.47, "overview"),
        ]
        prev = Path("/tmp/map-preview")
        prev.mkdir(exist_ok=True)
        for z, lat, lon, name in samples:
            x, y = lon_to_x(lon, z), lat_to_y(lat, z)
            render_tile(z, x, y, str(out))
            src = out / str(z) / str(x) / f"{y}.png"
            dest = prev / f"{name}-z{z}-{x}-{y}.png"
            dest.write_bytes(src.read_bytes())
            print("preview", dest, src.stat().st_size)
        return

    if "-" in args.zooms:
        a, b = args.zooms.split("-")
        zooms = range(int(a), int(b) + 1)
    else:
        zooms = [int(z) for z in args.zooms.split(",")]

    tiles = []
    for z in zooms:
        batch = list(iter_tiles(z))
        print(f"z{z} tiles {len(batch)}")
        tiles.extend(batch)
    print("total", len(tiles), "workers", args.workers)
    started = time.time()
    jobs = [(z, x, y, str(out)) for z, x, y in tiles]
    done = 0
    if args.workers <= 1:
        for job in jobs:
            render_job(job)
            done += 1
            if done % 50 == 0:
                print(f"{done}/{len(jobs)}", flush=True)
    else:
        with ProcessPoolExecutor(max_workers=args.workers, mp_context=mp.get_context("fork")) as pool:
            futs = [pool.submit(render_job, job) for job in jobs]
            for fut in as_completed(futs):
                fut.result()
                done += 1
                if done % 100 == 0 or done == len(jobs):
                    print(f"{done}/{len(jobs)} {time.time()-started:.0f}s", flush=True)
    print(f"done {done} tiles in {time.time()-started:.1f}s")


if __name__ == "__main__":
    main()
