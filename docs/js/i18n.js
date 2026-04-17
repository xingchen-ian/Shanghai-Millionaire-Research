// ===== Shanghai Millionaire — i18n Engine =====
// Uses data-i18n attributes on HTML elements + a translation dictionary.
// Language preference persists in localStorage across pages.

(function () {
  'use strict';

  const STORAGE_KEY = 'sm_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED = ['en', 'zh'];

  // Translation dictionary — keyed by data-i18n value
  const T = {
    // ===== NAV (shared) =====
    'nav.logo':         { en: 'Shanghai Millionaire', zh: '上海大富翁' },
    'nav.game':         { en: 'The Game', zh: '游戏' },
    'nav.printers':     { en: 'Printers', zh: '印刷溯源' },
    'nav.camps':        { en: 'Camps & Refugees', zh: '集中营与难民' },
    'nav.resources':    { en: 'Resources', zh: '研究资源' },
    'lang.btn':         { en: '中文', zh: 'EN' },

    // ===== INDEX =====
    'index.eyebrow':    { en: '1930s\u20131940s \u00B7 Shanghai International Settlement', zh: '1930\u20131940\u5E74\u00B7\u4E0A\u6D77\u516C\u5171\u79DF\u754C' },
    'index.title':      { en: 'Shanghai Millionaire', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1' },
    'index.subtitle':   { en: 'A pirated Monopoly variant, a wartime city, and an unsolved printing mystery.', zh: '\u4E00\u6B3E\u76D7\u7248\u5927\u5BCC\u7FC1\u3001\u4E00\u5EA7\u6218\u65F6\u57CE\u5E02\u3001\u4E00\u4E2A\u672A\u89E3\u7684\u5370\u5237\u8C1C\u56E2\u3002' },
    'index.cta':        { en: 'Explore the Research \u2192', zh: '\u63A2\u7D22\u7814\u7A76 \u2192' },
    'index.introTitle': { en: 'A Game Born in War', zh: '\u8BDE\u751F\u4E8E\u6218\u706B\u7684\u6E38\u620F' },
    'index.intro1':     { en: 'In the late 1930s, as Europe descended into chaos and refugees flooded into Shanghai\'s International Settlement, someone printed an English-language board game called\u00A0<em>The Game of Shanghai Millionaire</em>\u00A0\u2014 a pirated copy of Waddington\'s London edition of Monopoly, with Shanghai streets replacing London ones.', zh: '1930\u5E74\u4EE3\u672B\uFF0C\u5F53\u6B27\u6D32\u9677\u5165\u6DF7\u4E71\u3001\u96BE\u6C11\u6D8C\u5165\u4E0A\u6D77\u516C\u5171\u79DF\u754C\u65F6\uFF0C\u6709\u4EBA\u5370\u5237\u4E86\u4E00\u6B3E\u82F1\u6587\u684C\u6E38\u53EB\u505A<em>The Game of Shanghai Millionaire</em>\u2014\u2014\u5B83\u662F\u82F1\u56FD Waddington \u4F26\u6566\u7248\u5927\u5BCC\u7FC1\u7684\u76D7\u7248\uFF0C\u5C06\u4F26\u6566\u8857\u540D\u66FF\u6362\u4E3A\u4E0A\u6D77\u8857\u540D\u3002' },
    'index.intro2':     { en: 'The manufacturer remains unknown. This project traces the game\'s history, its contexts, and the candidates who may have printed it.', zh: '\u5370\u5237\u8005\u81F3\u4ECA\u4E0D\u660E\u3002\u672C\u9879\u76EE\u8FFD\u6EAF\u8FD9\u6B3E\u6E38\u620F\u7684\u5386\u53F2\u3001\u80CC\u666F\uFF0C\u4EE5\u53CA\u53EF\u80FD\u5370\u5237\u5B83\u7684\u5019\u9009\u5382\u5546\u3002' },
    'index.stat1Num':   { en: '~1940', zh: '\u7EA61940' },
    'index.stat1Label': { en: 'Estimated production year', zh: '\u4F30\u8BA1\u751F\u4EA7\u5E74\u4EFD' },
    'index.stat2Num':   { en: '48.5cm\u00B2', zh: '48.5cm\u00B2' },
    'index.stat2Label': { en: 'Board dimensions', zh: '\u68CB\u76D8\u5C3A\u5BF8' },
    'index.stat3Num':   { en: '22', zh: '22' },
    'index.stat3Label': { en: 'Shanghai streets on board', zh: '\u68CB\u76D8\u4E0A\u7684\u4E0A\u6D77\u8857\u9053' },
    'index.stat4Num':   { en: '2', zh: '2' },
    'index.stat4Label': { en: 'Known versions (commercial + handmade)', zh: '\u5DF2\u77E5\u7248\u672C\uFF08\u5546\u4E1A\u5370\u5237 + \u624B\u5DE5\u7248\uFF09' },
    'index.tracksTitle':{ en: 'Research Tracks', zh: '\u7814\u7A76\u8F68\u9053' },
    'index.track1Title': { en: 'The Game', zh: '\u6E38\u620F' },
    'index.track1Desc':  { en: 'Two versions of Shanghai Millionaire: a commercially printed edition and a handmade copy by refugee children. Design analysis and street-name localization.', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7684\u4E24\u4E2A\u7248\u672C\uFF1A\u5546\u4E1A\u5370\u5237\u7248\u548C\u96BE\u6C11\u513F\u7AE5\u7684\u624B\u5DE5\u590D\u5236\u7248\u3002\u8BBE\u8BA1\u5206\u6790\u4E0E\u8857\u540D\u672C\u5730\u5316\u3002' },
    'index.track2Title': { en: 'Printer Tracing', zh: '\u5370\u5237\u6EAF\u6E90' },
    'index.track2Desc':  { en: 'Who printed it? Eleven candidates from Shanghai\'s foreign-owned and Chinese printing industry, ranked by likelihood.', zh: '\u8C01\u5370\u5237\u4E86\u5B83\uFF1F\u6765\u81EA\u4E0A\u6D77\u5916\u8D44\u548C\u534E\u8D44\u5370\u5237\u4E1A\u768411\u5BB6\u5019\u9009\uFF0C\u6309\u53EF\u80FD\u6027\u6392\u5E8F\u3002' },
    'index.track3Title': { en: 'Camps & Refugees', zh: '\u96C6\u4E2D\u8425\u4E0E\u96BE\u6C11' },
    'index.track3Desc':  { en: 'Japanese internment camps, the Hongkew Ghetto, and how Shanghai\'s wartime communities used games for survival.', zh: '\u65E5\u519B\u96C6\u4E2D\u8425\u3001\u8679\u53E3\u9694\u90FD\uFF0C\u4EE5\u53CA\u4E0A\u6D77\u6218\u65F6\u793E\u533A\u5982\u4F55\u4EE5\u6E38\u620F\u6C42\u751F\u5B58\u3002' },
    'index.track4Title': { en: 'Resources', zh: '\u7814\u7A76\u8D44\u6E90' },
    'index.track4Desc':  { en: 'Archives, databases, maps, and key references for further research.', zh: '\u6863\u6848\u3001\u6570\u636E\u5E93\u3001\u5730\u56FE\u548C\u5173\u952E\u53C2\u8003\u6587\u732E\u3002' },
    'index.tlTitle':    { en: 'Historical Timeline', zh: '\u5386\u53F2\u65F6\u95F4\u7EBF' },
    'index.tl1':        { en: 'Waddington\'s London edition of Monopoly released in the UK', zh: 'Waddington \u4F26\u6566\u7248\u5927\u5BCC\u7FC1\u5728\u82F1\u56FD\u53D1\u884C' },
    'index.tl2':        { en: 'Battle of Shanghai; Cuihua Card Factory ceases production', zh: '\u6淞\u6CAA\u4F1A\u6218\uFF1B\u7CB9\u534E\u5361\u7247\u5382\u505C\u4EA7' },
    'index.tl3':        { en: '<strong>Shanghai Millionaire</strong> commercially printed and sold at Wing On department store', zh: '<strong>\u4E0A\u6D77\u5927\u5BCC\u7FC1</strong>\u5546\u4E1A\u5370\u5237\uFF0C\u5728\u6C38\u5B89\u767E\u8D27\u552E\u5356' },
    'index.tl4':        { en: '~20,000 Jewish refugees arrive in Shanghai', zh: '\u7EA620,000\u540D\u72B9\u592A\u96BE\u6C11\u62B5\u8FBE\u4E0A\u6D77' },
    'index.tl5':        { en: 'Japan occupies International Settlement; NCDN shuts down', zh: '\u65E5\u519B\u5360\u9886\u516C\u5171\u79DF\u754C\uFF1B\u5B57\u6797\u897F\u62A5\u505C\u520A' },
    'index.tl6':        { en: 'Japanese internment camps established; Hongkew Ghetto designated', zh: '\u65E5\u519B\u96C6\u4E2D\u8425\u8BBE\u7ACB\uFF1B\u8679\u53E3\u9694\u90FD\u5212\u5B9A' },
    'index.tl7':        { en: 'Lobel brothers hand-draw their own <strong>Shanghai Millionaire</strong> in the Hongkew Ghetto', zh: 'Lobel\u5144\u5F1F\u5728\u8679\u53E3\u9694\u90FD\u624B\u7ED8\u81EA\u5236<strong>\u4E0A\u6D77\u5927\u5BCC\u7FC1</strong>' },
    'index.footer1':    { en: 'Shanghai Millionaire Research Project \u00B7 Ian \u00B7 NYU Shanghai \u00B7 2026', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7814\u7A76\u9879\u76EE \u00B7 Ian \u00B7 \u7EBD\u7EA6\u5927\u5B66\u4E0A\u6D77 \u00B7 2026' },
    'index.footer2':    { en: 'This is an ongoing academic research project. If you have information about Shanghai Millionaire, please get in touch.', zh: '\u672C\u9879\u76EE\u4E3A\u6301\u7EED\u8FDB\u884C\u7684\u5B66\u672F\u7814\u7A76\u3002\u5982\u60A8\u6709\u5173\u4E8E\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7684\u7EBF\u7D22\uFF0C\u8BF7\u4E0E\u6211\u4EEC\u8054\u7CFB\u3002' },

    // ===== GAME =====
    'game.eyebrow':     { en: 'Research Track 01', zh: '\u7814\u7A76\u8F68\u9053 01' },
    'game.title':       { en: 'The Game', zh: '\u6E38\u620F' },
    'game.lead':        { en: 'Two versions of Shanghai Millionaire survive \u2014 one commercially printed, one hand-drawn by refugee children.', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u6709\u4E24\u4E2A\u5DF2\u77E5\u7248\u672C\u2014\u2014\u4E00\u4E2A\u5546\u4E1A\u5370\u5237\u7248\uFF0C\u4E00\u4E2A\u96BE\u6C11\u513F\u7AE5\u624B\u7ED8\u7248\u3002' },
    'game.versions':    { en: 'Two Versions', zh: '\u4E24\u4E2A\u7248\u672C' },
    'game.comBadge':    { en: 'Commercial Edition', zh: '\u5546\u4E1A\u5370\u5237\u7248' },
    'game.comTitle':    { en: 'The Printed Game', zh: '\u5370\u5237\u7248\u6E38\u620F' },
    'game.comName':     { en: 'Name', zh: '\u540D\u79F0' },
    'game.comNameV':    { en: 'The Game of Shanghai Millionaire', zh: 'The Game of Shanghai Millionaire' },
    'game.comDate':     { en: 'Estimated Date', zh: '\u4F30\u8BA1\u5E74\u4EE3' },
    'game.comDateV':    { en: '~1938\u20131940', zh: '\u7EA61938\u20131940' },
    'game.comMfr':      { en: 'Manufacturer', zh: '\u5236\u9020\u5546' },
    'game.comMfrV':     { en: 'Unknown (Shanghai)', zh: '\u4E0D\u660E\uFF08\u4E0A\u6D77\uFF09' },
    'game.comSize':     { en: 'Board Size', zh: '\u68CB\u76D8\u5C3A\u5BF8' },
    'game.comLang':     { en: 'Language', zh: '\u8BED\u8A00' },
    'game.comLangV':    { en: 'English', zh: '\u82F1\u6587' },
    'game.comBased':    { en: 'Based On', zh: '\u539F\u7248\u6765\u6E90' },
    'game.comBasedV':   { en: 'Waddington\'s London Edition (UK)', zh: 'Waddington \u4F26\u6566\u7248\uFF08\u82F1\u56FD\uFF09' },
    'game.comSold':     { en: 'Sold At', zh: '\u9500\u552E\u5730\u70B9' },
    'game.comSoldV':    { en: 'Wing On department store, Nanking Road', zh: '\u5357\u4EAC\u8DEF\u6C38\u5B89\u767E\u8D27' },
    'game.comProd':     { en: 'Production', zh: '\u751F\u4EA7\u65B9\u5F0F' },
    'game.comProdV':    { en: 'Commercial, mass-produced', zh: '\u5546\u4E1A\u6279\u91CF\u751F\u4EA7' },
    'game.comNote':     { en: 'A well-printed, professionally manufactured game sold to Shanghai\'s foreign community. The design copies Waddington\'s London layout but substitutes Shanghai street names \u2014 a fact consistent with British influence in the International Settlement.', zh: '\u4E00\u6B3E\u5370\u5237\u7CBE\u826F\u7684\u4E13\u4E1A\u5236\u9020\u6E38\u620F\uFF0C\u9762\u5411\u4E0A\u6D77\u5916\u4FA8\u793E\u533A\u9500\u552E\u3002\u8BBE\u8BA1\u590D\u5236\u4E86 Waddington \u4F26\u6566\u7248\u5E03\u5C40\uFF0C\u4F46\u66FF\u6362\u4E3A\u4E0A\u6D77\u8857\u540D\u2014\u2014\u8FD9\u4E0E\u516C\u5171\u79DF\u754C\u7684\u82F1\u56FD\u5F71\u54CD\u529B\u4E00\u81F4\u3002' },
    'game.hmBadge':     { en: 'Handmade Edition', zh: '\u624B\u5DE5\u7248' },
    'game.hmTitle':     { en: 'The Lobel Brothers\' Copy', zh: 'Lobel \u5144\u5F1F\u7684\u590D\u5236\u7248' },
    'game.hmMakers':    { en: 'Makers', zh: '\u5236\u4F5C\u8005' },
    'game.hmMakersV':   { en: 'Siegfried Lobel (14) & Manfred Lobel (10)', zh: 'Siegfried Lobel (14\u5C81) \u4E0E Manfred Lobel (10\u5C81)' },
    'game.hmDate':      { en: 'Date', zh: '\u65E5\u671F' },
    'game.hmLoc':       { en: 'Location', zh: '\u5730\u70B9' },
    'game.hmLocV':      { en: 'Hongkew Ghetto, Shanghai', zh: '\u4E0A\u6D77\u8679\u53E3\u9694\u90FD' },
    'game.hmSize':      { en: 'Board Size', zh: '\u68CB\u76D8\u5C3A\u5BF8' },
    'game.hmSizeV':     { en: '35.9 \u00D7 35.9 cm (14.125 inches)', zh: '35.9 \u00D7 35.9 cm' },
    'game.hmMat':       { en: 'Materials', zh: '\u6750\u6599' },
    'game.hmMatV':      { en: 'US Army "K-ration" cardboard boxes, ink, pencils, colored pencils', zh: '\u7F8E\u519B K-\u53E3\u7CAE\u7EB8\u7BB1\u3001\u58A8\u6C34\u3001\u94C5\u7B14\u3001\u5F69\u8272\u94C5\u7B14' },
    'game.hmBased':     { en: 'Based On', zh: '\u539F\u7248\u6765\u6E90' },
    'game.hmBasedV':    { en: 'Monopoly rules (likely from memory)', zh: '\u5927\u5BCC\u7FC1\u89C4\u5219\uFF08\u53EF\u80FD\u51ED\u8BB0\u5FC6\uFF09' },
    'game.hmCur':       { en: 'Current Location', zh: '\u73B0\u85CF\u5730\u70B9' },
    'game.hmCurV':      { en: 'United States Holocaust Memorial Museum (2009.106.1)', zh: '\u7F8E\u56FD\u5927\u5C60\u6740\u7EAA\u5FF5\u535A\u7269\u9986 (2009.106.1)' },
    'game.hmDonor':     { en: 'Donor', zh: '\u6350\u8D60\u8005' },
    'game.hmDonorV':    { en: 'Manfred Lobel, 2009', zh: 'Manfred Lobel\uFF0C2009\u5E74' },
    'game.hmNote':      { en: 'Two German-Jewish refugee children, who fled Berlin for Shanghai in 1940, hand-drew their own version of the game a year after liberation. Made from ration boxes \u2014 a testament to the human need for play even in extremity.', zh: '\u4E24\u540D\u5FB7\u7C4D\u72B9\u592A\u96BE\u6C11\u513F\u7AE5\u4E8E1940\u5E74\u4ECE\u67CF\u6797\u9003\u4EA1\u4E0A\u6D77\uFF0C\u5728\u89E3\u653E\u540E\u4E00\u5E74\u624B\u7ED8\u4E86\u81EA\u5DF1\u7684\u6E38\u620F\u7248\u672C\u3002\u7528\u53E3\u7CAE\u7BB1\u5236\u4F5C\u2014\u2014\u8BC1\u660E\u4E86\u5373\u4F7F\u5728\u6781\u7AEF\u73AF\u5883\u4E2D\uFF0C\u4EBA\u4EEC\u4ECD\u7136\u9700\u8981\u6E38\u620F\u3002' },
    'game.designTitle': { en: 'Design Source: Waddington\'s, Not Parker Brothers', zh: '\u8BBE\u8BA1\u6765\u6E90\uFF1AWaddington\u800C\u975E Parker Brothers' },
    'game.design1':     { en: 'A critical finding is that Shanghai Millionaire copies the <strong>British Waddington\'s London edition</strong>, not the American Parker Brothers version. This makes sense historically: the International Settlement was a British-dominated enclave, and British cultural influence in Shanghai was pervasive.', zh: '\u4E00\u4E2A\u5173\u952E\u53D1\u73B0\u662F\uFF0C\u4E0A\u6D77\u5927\u5BCC\u7FC1\u590D\u5236\u7684\u662F<strong>\u82F1\u56FD Waddington \u4F26\u6566\u7248</strong>\uFF0C\u800C\u975E\u7F8E\u56FD Parker Brothers \u7248\u3002\u8FD9\u5728\u5386\u53F2\u4E0A\u5408\u7406\uFF1A\u516C\u5171\u79DF\u754C\u662F\u82F1\u56FD\u4E3B\u5BFC\u7684\u98DE\u5730\uFF0C\u82F1\u56FD\u6587\u5316\u5F71\u54CD\u529B\u65E0\u5904\u4E0D\u5728\u3002' },
    'game.design2':     { en: 'Key differences from the US version that confirm the Waddington\'s lineage:', zh: '\u8BC1\u5B9E Waddington \u8840\u7EDF\u7684\u5173\u952E\u5DEE\u5F02\uFF1A' },
    'game.designLi1':   { en: 'Board layout matches the London edition\'s property arrangement', zh: '\u68CB\u76D8\u5E03\u5C40\u4E0E\u4F26\u6566\u7248\u7684\u5730\u4EA7\u6392\u5217\u4E00\u81F4' },
    'game.designLi2':   { en: 'Use of "Community Chest" and "Chance" card categories', zh: '\u4F7F\u7528\u201C\u516C\u5171\u91D1\u5E93\u201D\u548C\u201C\u673A\u4F1A\u201D\u5361\u7247\u5206\u7C7B' },
    'game.designLi3':   { en: 'Color groupings correspond to the London, not Atlantic City, street sets', zh: '\u989C\u8272\u5206\u7EC4\u5BF9\u5E94\u4F26\u6566\u800C\u975E\u5927\u897F\u6D0B\u57CE\u7684\u8857\u9053\u7EC4' },
    'game.designLi4':   { en: 'The currency and token designs follow the Waddington\'s template', zh: '\u8D27\u5E01\u548C\u68CB\u5B50\u8BBE\u8BA1\u9075\u5FAA Waddington \u6A21\u677F' },
    'game.locTitle':    { en: 'Localization: Shanghai Streets', zh: '\u672C\u5730\u5316\uFF1A\u4E0A\u6D77\u8857\u9053' },
    'game.locDesc':     { en: 'The most distinctive feature of Shanghai Millionaire is its replacement of London streets with Shanghai ones. These names map onto the colonial geography of the International Settlement and French Concession:', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u6700\u72EC\u7279\u7684\u7279\u5F81\u662F\u5C06\u4F26\u6566\u8857\u540D\u66FF\u6362\u4E3A\u4E0A\u6D77\u8857\u540D\u3002\u8FD9\u4E9B\u540D\u79F0\u5BF9\u5E94\u516C\u5171\u79DF\u754C\u548C\u6CD5\u79DF\u754C\u7684\u6B96\u6C11\u5730\u7406\uFF1A' },
    'game.stPrem':      { en: 'Premium (Dark Blue)', zh: '\u9AD8\u7EA7\uFF08\u6DF1\u84DD\uFF09' },
    'game.stHigh':      { en: 'High Value (Green)', zh: '\u9AD8\u4EF7\u503C\uFF08\u7EFF\u8272\uFF09' },
    'game.stMid':       { en: 'Mid Value', zh: '\u4E2D\u7B49\u4EF7\u503C' },
    'game.stLow':       { en: 'Lower Value', zh: '\u8F83\u4F4E\u4EF7\u503C' },
    'game.stNow1':      { en: 'Now: Waitan (\u5916\u6EE9)', zh: '\u4ECA\uFF1A\u5916\u6EE9' },
    'game.stNow2':      { en: 'Now: Nanjing West Road (\u5357\u4EAC\u897F\u8DEF)', zh: '\u4ECA\uFF1A\u5357\u4EAC\u897F\u8DEF' },
    'game.stNow3':      { en: 'Now: Huaihai Middle Road (\u6DEE\u6D77\u4E2D\u8DEF)', zh: '\u4ECA\uFF1A\u6DEE\u6D77\u4E2D\u8DEF' },
    'game.stNow4':      { en: 'Now: Nanjing East Road (\u5357\u4EAC\u4E1C\u8DEF)', zh: '\u4ECA\uFF1A\u5357\u4EAC\u4E1C\u8DEF' },
    'game.stNow5':      { en: 'Now: People\'s Square area', zh: '\u4ECA\uFF1A\u4EBA\u6C11\u5E7F\u573A\u533A\u57DF' },
    'game.stNow6':      { en: 'Now: Xujiahui area', zh: '\u4ECA\uFF1A\u5F90\u5BB6\u6C47\u533A\u57DF' },
    'game.stNow7':      { en: 'Now: Jiangxi Road', zh: '\u4ECA\uFF1A\u6C5F\u897F\u8DEF' },
    'game.stNow8':      { en: 'Now: Yuenmingyuen Road', zh: '\u4ECA\uFF1A\u5706\u660E\u56ED\u8DEF' },
    'game.stCaption':   { en: 'Partial list \u2014 22 streets total on the board. Full mapping is an ongoing research task.', zh: '\u90E8\u5206\u5217\u8868\u2014\u2014\u68CB\u76D8\u4E0A\u5171\u670922\u6761\u8857\u9053\u3002\u5B8C\u6574\u6620\u5C04\u662F\u6301\u7EED\u8FDB\u884C\u7684\u7814\u7A76\u4EFB\u52A1\u3002' },
    'game.provTitle':   { en: 'Provenance', zh: '\u6D41\u4F20\u53F2' },
    'game.prov1':       { en: 'The known commercial copy was owned by <strong>Gary Korzenstein</strong> of Toronto, Canada. It came to him through his brother\'s friend in Montreal, whose family had fled Eastern Europe for Shanghai before or during World War II, then emigrated to Canada before or during the 1949 revolution.', zh: '\u5DF2\u77E5\u7684\u5546\u4E1A\u5370\u5237\u7248\u6240\u6709\u8005\u662F\u52A0\u62FF\u5927\u591A\u4F26\u591A\u7684<strong>Gary Korzenstein</strong>\u3002\u8FD9\u5957\u6E38\u620F\u901A\u8FC7\u4ED6\u54E5\u54E5\u5728\u8499\u7279\u5229\u5C14\u7684\u670B\u53CB\u8F6C\u5230\u4ED6\u624B\u4E2D\uFF0C\u5176\u5BB6\u65CF\u66FE\u5728\u4E8C\u6218\u524D\u6216\u6218\u65F6\u4ECE\u4E1C\u6B27\u9003\u4EA1\u4E0A\u6D77\uFF0C\u7136\u540E\u57281949\u5E74\u9769\u547D\u524D\u6216\u671F\u95F4\u79FB\u5C45\u52A0\u62FF\u5927\u3002' },
    'game.prov2':       { en: 'This migration path \u2014 Eastern Europe \u2192 Shanghai \u2192 Canada \u2014 mirrors the trajectory of many Jewish refugee families who found temporary sanctuary in Shanghai\'s open port.', zh: '\u8FD9\u6761\u8FC1\u79FB\u8DEF\u5F84\u2014\u2014\u4E1C\u6B27\u2192\u4E0A\u6D77\u2192\u52A0\u62FF\u5927\u2014\u2014\u6298\u5C04\u4E86\u8BB8\u591A\u72B9\u592A\u96BE\u6C11\u5BB6\u5EAD\u7684\u8F68\u8FF9\uFF0C\u4ED6\u4EEC\u5728\u4E0A\u6D77\u8FD9\u4E2A\u5F00\u653E\u6E2F\u53E3\u627E\u5230\u4E86\u4E34\u65F6\u907F\u96BE\u6240\u3002' },
    'game.footer':      { en: 'Shanghai Millionaire Research Project \u00B7 Ian \u00B7 NYU Shanghai \u00B7 2026', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7814\u7A76\u9879\u76EE \u00B7 Ian \u00B7 \u7EBD\u7EA6\u5927\u5B66\u4E0A\u6D77 \u00B7 2026' },

    // ===== PRINTERS =====
    'pr.eyebrow':       { en: 'Research Track 02', zh: '\u7814\u7A76\u8F68\u9053 02' },
    'pr.title':         { en: 'Printer Tracing', zh: '\u5370\u5237\u6EAF\u6E90' },
    'pr.lead':          { en: 'Who printed Shanghai Millionaire? Eleven candidates identified from Shanghai\'s 1930s\u201340s printing industry.', zh: '\u8C01\u5370\u5237\u4E86\u4E0A\u6D77\u5927\u5BCC\u7FC1\uFF1F\u6839\u636E1930-40\u5E74\u4EE3\u4E0A\u6D77\u5370\u5237\u4E1A\u8BC6\u522B\u51FA11\u5BB6\u5019\u9009\u3002' },
    'pr.evidence':      { en: 'Known Evidence', zh: '\u5DF2\u77E5\u7EBF\u7D22' },
    'pr.evTh1':         { en: 'Clue', zh: '\u7EBF\u7D22' },
    'pr.evTh2':         { en: 'Source', zh: '\u6765\u6E90' },
    'pr.evTh3':         { en: 'Reliability', zh: '\u53EF\u9760\u6027' },
    'pr.ev1':           { en: 'Based on Waddington\'s London edition', zh: '\u57FA\u4E8E Waddington \u4F26\u6566\u7248' },
    'pr.ev1s':          { en: 'World of Monopoly (Albert Veldhuis)', zh: 'World of Monopoly (Albert Veldhuis)' },
    'pr.ev1r':          { en: 'High', zh: '\u9AD8' },
    'pr.ev2':           { en: 'Produced ~late 1930s / early 1940s', zh: '\u751F\u4EA7\u4E8E\u7EA61930\u5E74\u4EE3\u672B/1940\u5E74\u4EE3\u521D' },
    'pr.ev2s':          { en: 'rickshaw.org (Ralph Harpuder)', zh: 'rickshaw.org (Ralph Harpuder)' },
    'pr.ev2r':          { en: 'Medium', zh: '\u4E2D' },
    'pr.ev3':           { en: 'Sold at <strong>Wing On</strong> department store', zh: '\u5728<strong>\u6C38\u5B89\u767E\u8D27</strong>\u552E\u5356' },
    'pr.ev3s':          { en: 'rickshaw.org', zh: 'rickshaw.org' },
    'pr.ev3r':          { en: 'High', zh: '\u9AD8' },
    'pr.ev4':           { en: 'Commercial mass production (not hand-made)', zh: '\u5546\u4E1A\u6279\u91CF\u751F\u4EA7\uFF08\u975E\u624B\u5DE5\u5236\u4F5C\uFF09' },
    'pr.ev4s':          { en: 'Kent McKeever analysis', zh: 'Kent McKeever \u5206\u6790' },
    'pr.ev4r':          { en: 'Medium', zh: '\u4E2D' },
    'pr.ev5':           { en: 'Well-printed, 48.5\u00D748.5cm, all English', zh: '\u5370\u5237\u7CBE\u826F\uFF0C48.5\u00D748.5cm\uFF0C\u5168\u82F1\u6587' },
    'pr.ev5s':          { en: 'Ian\'s physical examination', zh: 'Ian \u5B9E\u7269\u68C0\u67E5' },
    'pr.ev5r':          { en: 'High', zh: '\u9AD8' },
    'pr.ev6':           { en: 'Original owner\'s family fled E. Europe to Shanghai', zh: '\u539F\u6240\u6709\u8005\u5BB6\u65CF\u4ECE\u4E1C\u6B27\u9003\u4EA1\u4E0A\u6D77' },
    'pr.ev6s':          { en: 'Gary Korzenstein (collector)', zh: 'Gary Korzenstein\uFF08\u6536\u85CF\u5BB6\uFF09' },
    'pr.ev6r':          { en: 'High', zh: '\u9AD8' },
    'pr.ev7':           { en: 'Board back: black underside + white label', zh: '\u68CB\u76D8\u80CC\u9762\uFF1A\u9ED1\u8272\u5E95\u9762 + \u767D\u8272\u6807\u7B7E' },
    'pr.ev7s':          { en: 'World of Monopoly description', zh: 'World of Monopoly \u63CF\u8FF0' },
    'pr.ev7r':          { en: 'Label text unknown', zh: '\u6807\u7B7E\u6587\u5B57\u4E0D\u660E' },
    'pr.ev8':           { en: 'Manufacturer: Unknown', zh: '\u5236\u9020\u5546\uFF1A\u4E0D\u660E' },
    'pr.ev8s':          { en: 'World of Monopoly', zh: 'World of Monopoly' },
    'pr.ev8r':          { en: '\u2014', zh: '\u2014' },
    'pr.callout':       { en: '<strong>Key Inference:</strong> Producing this game required color printing capability (board + currency + deed cards), cardboard box manufacturing, English typesetting, and access to the expatriate retail market.', zh: '<strong>\u5173\u952E\u63A8\u65AD\uFF1A</strong>\u751F\u4EA7\u8FD9\u6B3E\u6E38\u620F\u9700\u8981\u5F69\u8272\u5370\u5237\u80FD\u529B\uFF08\u68CB\u76D8 + \u8D27\u5E01 + \u5730\u5951\u5361\uFF09\u3001\u7EB8\u7BB1\u5236\u9020\u3001\u82F1\u6587\u6392\u7248\u4EE5\u53CA\u5916\u4FA8\u96F6\u552E\u5E02\u573A\u6E20\u9053\u3002' },
    'pr.candidates':    { en: 'Candidate Ranking', zh: '\u5019\u9009\u6392\u5E8F' },
    'pr.c1Type':        { en: 'Type', zh: '\u7C7B\u578B' },
    'pr.c1TypeV':       { en: 'British-owned advertising & printing company', zh: '\u82F1\u8D44\u5E7F\u544A\u5370\u5237\u516C\u53F8' },
    'pr.c1Founded':     { en: 'Founded', zh: '\u521B\u529E' },
    'pr.c1FoundedV':    { en: '1927 by Francis C. Millington', zh: '1927\u5E74\uFF0CFrancis C. Millington \u521B\u529E' },
    'pr.c1Loc':         { en: 'Location', zh: '\u5730\u5740' },
    'pr.c1LocV':        { en: 'Nanking Road \u2192 Hong Kong Road (Central Garage building)', zh: '\u5357\u4EAC\u8DEF\u2192\u9999\u6E2F\u8DEF\uFF08\u4E2D\u592E\u8F66\u5E93\u5927\u697C\uFF09' },
    'pr.c1Cap':         { en: 'Capabilities', zh: '\u80FD\u529B' },
    'pr.c1CapV':        { en: 'Commercial color printing, advertising, publishing', zh: '\u5546\u4E1A\u5F69\u8272\u5370\u5237\u3001\u5E7F\u544A\u3001\u51FA\u7248' },
    'pr.c1Scale':       { en: 'Scale', zh: '\u89C4\u6A21' },
    'pr.c1ScaleV':      { en: 'Issued stock in 1937; HSBC was a major shareholder (1,000 shares \u00D7 $4)', zh: '1937\u5E74\u53D1\u884C\u80A1\u7968\uFF1B\u6C47\u4E30\u94F6\u884C\u4E3A\u4E3B\u8981\u80A1\u4E1C\uFF081,000\u80A1\u00D74\u5143\uFF09' },
    'pr.c1Why':         { en: '<strong>Why top candidate:</strong> A British advertising and printing firm serving the expatriate market \u2014 exactly the kind of business that would take on a commercial print run of an English-language board game. The company also ran the "Millington Art School," indicating creative production capacity.', zh: '<strong>\u4E3A\u4F55\u662F\u9996\u9009\uFF1A</strong>\u4E00\u5BB6\u670D\u52A1\u5916\u4FA8\u5E02\u573A\u7684\u82F1\u8D44\u5E7F\u544A\u5370\u5237\u516C\u53F8\u2014\u2014\u6B63\u662F\u53EF\u80FD\u627F\u63A5\u82F1\u6587\u684C\u6E38\u620F\u5546\u4E1A\u5370\u5237\u7684\u7C7B\u578B\u3002\u516C\u53F8\u8FD8\u8FD0\u8425\u201C\u7F8E\u7075\u767B\u753B\u6821\u201D\uFF0C\u8868\u660E\u5177\u6709\u521B\u610F\u751F\u4EA7\u80FD\u529B\u3002' },
    'pr.c1Next':        { en: '<strong>Next steps:</strong> Search Millington\'s 1937\u20131940 commercial printing order records; look for Millington ads in the <em>North-China Daily News</em>.', zh: '<strong>\u4E0B\u4E00\u6B65\uFF1A</strong>\u641C\u7D22\u7F8E\u7075\u767B1937-1940\u5E74\u5546\u4E1A\u5370\u5237\u8BA2\u5355\u8BB0\u5F55\uFF1B\u5728\u300A\u5B57\u6797\u897F\u62A5\u300B\u4E2D\u67E5\u627E\u7F8E\u7075\u767B\u5E7F\u544A\u3002' },
    'pr.c2TypeV':       { en: 'Chinese-owned playing card manufacturer', zh: '\u534E\u8D44\u6251\u514B\u724C\u5236\u9020\u5546' },
    'pr.c2FoundedV':    { en: '1919 by Huang Disheng', zh: '1919\u5E74\uFF0C\u9EC4\u8FEA\u58F0 \u521B\u529E' },
    'pr.c2LocV':        { en: 'Zhengjiamuqiao, Shanghai (now Fujian Middle Road)', zh: '\u90D1\u5BB6\u6728\u6865\uFF08\u4ECA\u798F\u5EFA\u4E2D\u8DEF\uFF09' },
    'pr.c2Mile':        { en: 'Key milestone', zh: '\u5173\u952E\u91CC\u7A0B\u7891' },
    'pr.c2MileV':       { en: '1931: Imported German equipment, began commercial playing card production', zh: '1931\u5E74\uFF1A\u5F15\u8FDB\u5FB7\u56FD\u8BBE\u5907\uFF0C\u5F00\u59CB\u5546\u4E1A\u5316\u6251\u514B\u724C\u751F\u4EA7' },
    'pr.c2Ceased':      { en: 'Ceased', zh: '\u505C\u4EA7' },
    'pr.c2CeasedV':     { en: '1937 (Japanese occupation of Shanghai)', zh: '1937\u5E74\uFF08\u65E5\u5360\u4E0A\u6D77\uFF09' },
    'pr.c2Why':         { en: '<strong>Why strong candidate:</strong> China\'s first playing card factory \u2014 its product line (cards, certificates, invitations) is a direct match for board game components. The "Circus Clown" (\u9A6C\u620F\u4E11\u89D2) brand proved its color card-printing capability. <em>However</em>, 1937 shutdown is problematic if the game was produced after 1937.', zh: '<strong>\u4E3A\u4F55\u5F3A\u52B2\uFF1A</strong>\u4E2D\u56FD\u7B2C\u4E00\u5BB6\u6251\u514B\u724C\u5382\u2014\u2014\u5176\u4EA7\u54C1\u7EBF\uFF08\u7EB8\u724C\u3001\u8BC1\u4E66\u3001\u8BF7\u67EC\uFF09\u4E0E\u684C\u6E38\u7EC4\u4EF6\u76F4\u63A5\u5339\u914D\u3002\u201C\u9A6C\u620F\u4E11\u89D2\u201D\u54C1\u724C\u8BC1\u660E\u4E86\u5176\u5F69\u8272\u5361\u7247\u5370\u5237\u80FD\u529B\u3002\u4F46\u5982\u679C\u6E38\u620F\u57281937\u5E74\u540E\u751F\u4EA7\uFF0C1937\u5E74\u505C\u4EA7\u5C31\u662F\u95EE\u9898\u3002' },
    'pr.c2Next':        { en: '<strong>Next steps:</strong> Check if Cuihua accepted English-language game commissions; examine product catalogs from 1931\u20131937.', zh: '<strong>\u4E0B\u4E00\u6B65\uFF1A</strong>\u68C0\u67E5\u7CB9\u534E\u662F\u5426\u63A5\u53D7\u82F1\u6587\u6E38\u620F\u8BA2\u5355\uFF1B\u67E5\u96051931-1937\u5E74\u4EA7\u54C1\u76EE\u5F55\u3002' },
    'pr.c3TypeV':       { en: 'British-owned publisher, printer, bookseller', zh: '\u82F1\u8D44\u51FA\u7248\u5546\u3001\u5370\u5237\u5546\u3001\u4E66\u5546' },
    'pr.c3FoundedV':    { en: '1876 (merger of Kelly & Co. and F. & C. Walsh)', zh: '1876\u5E74\uFF08Kelly & Co. \u4E0E F. & C. Walsh \u5408\u5E76\uFF09' },
    'pr.c3LocV':        { en: 'The Bund No. 11 \u2192 Nanking Road (from 1918)', zh: '\u5916\u6EE911\u53F7\u2192\u5357\u4EAC\u8DEF\uFF081918\u5E74\u8D77\uFF09' },
    'pr.c3CapV':        { en: 'High-quality printing "of every description," lithography, stationery', zh: '\u9AD8\u8D28\u91CF\u201C\u5404\u7C7B\u201D\u5370\u5237\u3001\u77F3\u5370\u3001\u6587\u5177' },
    'pr.c3ProdV':       { en: 'English books, postcards, souvenir albums (e.g., <em>Shanghai of To-Day</em>)', zh: '\u82F1\u6587\u4E66\u7C4D\u3001\u660E\u4FE1\u7247\u3001\u7EAA\u5FF5\u518C\uFF08\u5982\u300AShanghai of To-Day\u300B\uFF09' },
    'pr.c3Post':        { en: 'Post-1941', zh: '1941\u5E74\u540E' },
    'pr.c3PostV':       { en: 'Relocated to Hong Kong after Japanese occupation', zh: '\u65E5\u5360\u540E\u8FC1\u81F3\u9999\u6E2F' },
    'pr.c3Why':         { en: '<strong>Why plausible:</strong> Shanghai\'s premier English-language publisher with proven color printing quality and expatriate market access. No evidence of game products, but their "every description" printing claim leaves the door open.', zh: '<strong>\u4E3A\u4F55\u53EF\u80FD\uFF1A</strong>\u4E0A\u6D77\u9996\u5C48\u4E00\u6307\u7684\u82F1\u6587\u51FA\u7248\u5546\uFF0C\u5370\u5237\u8D28\u91CF\u4E0E\u5916\u4FA8\u5E02\u573A\u6E20\u9053\u5747\u5DF2\u8BC1\u5B9E\u3002\u65E0\u6E38\u620F\u4EA7\u54C1\u8BC1\u636E\uFF0C\u4F46\u5176\u201C\u5404\u7C7B\u5370\u5237\u201D\u7684\u58F0\u660E\u7559\u6709\u4F59\u5730\u3002' },
    'pr.tier2':         { en: 'Second Tier', zh: '\u7B2C\u4E8C\u68AF\u961F' },
    'pr.tier3':         { en: 'Third Tier', zh: '\u7B2C\u4E09\u68AF\u961F' },
    'pr.c4Desc':        { en: 'Shanghai\'s largest English newspaper, with industrial printing facilities that sometimes took commercial print jobs. Ceased publication 1941\u201345 under Japanese occupation \u2014 matches the production window of ~1938\u20131940.', zh: '\u4E0A\u6D77\u6700\u5927\u82F1\u6587\u62A5\u7EB8\uFF0C\u62E5\u6709\u5DE5\u4E1A\u7EA7\u5370\u5237\u8BBE\u65BD\uFF0C\u5076\u5C14\u627F\u63A5\u5546\u4E1A\u5370\u5237\u8BA2\u5355\u3002\u65E5\u5360\u671F\u95F41941-45\u5E74\u505C\u520A\u2014\u2014\u4E0E\u7EA61938-1940\u7684\u751F\u4EA7\u7A97\u53E3\u5339\u914D\u3002' },
    'pr.c5Desc':        { en: 'Shanghai\'s largest printing enterprise, with full color printing and English typesetting (20-year partnership with Macmillan). But its business model centered on Chinese-language textbooks, and wartime damage (1932 bombing, 1937 battle) severely constrained capacity.', zh: '\u4E0A\u6D77\u6700\u5927\u5370\u5237\u4F01\u4E1A\uFF0C\u5177\u5907\u5168\u5F69\u5370\u5237\u548C\u82F1\u6587\u6392\u7248\u80FD\u529B\uFF08\u4E0E\u9EA6\u7C73\u4F26\u5408\u4F5C20\u5E74\uFF09\u3002\u4F46\u5176\u5546\u4E1A\u6A21\u5F0F\u4EE5\u4E2D\u6587\u6559\u79D1\u4E66\u4E3A\u4E3B\uFF0C\u6218\u65F6\u635F\u5931\uFF081932\u5E74\u8F70\u70B8\u30011937\u5E74\u6218\u6597\uFF09\u4E25\u91CD\u5236\u7EA6\u4E86\u5176\u80FD\u529B\u3002' },
    'pr.c6Desc':        { en: '<strong>Chung Hwa Book Co. \u4E2D\u534E\u4E66\u5C40</strong> \u2B50\u2B50 \u2014 Similar to Commercial Press but less English capability.', zh: '<strong>\u4E2D\u534E\u4E66\u5C40</strong> \u2B50\u2B50 \u2014 \u4E0E\u5546\u52A1\u5370\u4E66\u9986\u7C7B\u4F3C\uFF0C\u4F46\u82F1\u6587\u80FD\u529B\u8F83\u5F31\u3002' },
    'pr.c7Desc':        { en: '<strong>Ikeda Printing Co. \u6C60\u7530\u5370\u5237\u682A\u5F0F\u4F1A\u793E</strong> \u2B50\u2B50\u2B50 \u2014 Japanese-owned color printing; unlikely to print British pirated games after 1937.', zh: '<strong>\u6C60\u7530\u5370\u5237\u682A\u5F0F\u4F1A\u793E</strong> \u2B50\u2B50\u2B50 \u2014 \u65E5\u8D44\u5F69\u8272\u5370\u5237\uFF1B1937\u5E74\u540E\u4E0D\u592A\u53EF\u80FD\u5370\u5237\u82F1\u56FD\u76D7\u7248\u6E38\u620F\u3002' },
    'pr.c8Desc':        { en: '<strong>Russian Emigre Presses</strong> \u2B50\u2B50 \u2014 Small-scale, primarily Russian-language; insufficient commercial capacity.', zh: '<strong>\u4FC4\u4FA8\u5370\u5237\u5382</strong> \u2B50\u2B50 \u2014 \u5C0F\u89C4\u6A21\uFF0C\u4E3B\u8981\u5370\u4FC4\u8BED\uFF1B\u5546\u4E1A\u80FD\u529B\u4E0D\u8DB3\u3002' },
    'pr.c9Desc':        { en: '<strong>Jewish Refugee Presses</strong> \u2B50\u2B50 \u2014 Small German/Yiddish newspapers; no evidence of color printing capability.', zh: '<strong>\u72B9\u592A\u96BE\u6C11\u5370\u5237\u5382</strong> \u2B50\u2B50 \u2014 \u5C0F\u578B\u5FB7\u8BED/\u610F\u7B2C\u7EE0\u8BED\u62A5\u7EB8\uFF1B\u65E0\u5F69\u8272\u5370\u5237\u80FD\u529B\u8BC1\u636E\u3002' },
    'pr.twTitle':       { en: 'Time Window Analysis', zh: '\u65F6\u95F4\u7A97\u53E3\u5206\u6790' },
    'pr.tw1Title':      { en: 'Before 1937', zh: '1937\u5E74\u4E4B\u524D' },
    'pr.tw1Desc':       { en: 'All candidates possible. <strong>Cuihua Card Factory</strong> is the strongest match \u2014 it was actively producing playing cards and had German printing equipment.', zh: '\u6240\u6709\u5019\u9009\u7686\u6709\u53EF\u80FD\u3002<strong>\u7CB9\u534E\u5361\u7247\u5382</strong>\u662F\u6700\u5F3A\u5339\u914D\u2014\u2014\u5F53\u65F6\u6B63\u5728\u751F\u4EA7\u6251\u514B\u724C\uFF0C\u62E5\u6709\u5FB7\u56FD\u5370\u5237\u8BBE\u5907\u3002' },
    'pr.tw2Title':      { en: '1937\u20131941', zh: '1937\u20131941\u5E74' },
    'pr.tw2Desc':       { en: 'Cuihua shut down. Japanese firms unlikely. <strong>Millington</strong> and <strong>Kelly & Walsh</strong> rise to the top \u2014 British firms still operating in the Settlement, serving the expatriate market.', zh: '\u7CB9\u534E\u505C\u4EA7\u3002\u65E5\u8D44\u4F01\u4E1A\u4E0D\u592A\u53EF\u80FD\u3002<strong>\u7F8E\u7075\u767B</strong>\u548C<strong>\u522B\u53D1\u6D0B\u884C</strong>\u5347\u81F3\u9996\u4F4D\u2014\u2014\u82F1\u8D44\u4F01\u4E1A\u4ECD\u5728\u79DF\u754C\u8FD0\u8425\uFF0C\u670D\u52A1\u5916\u4FA8\u5E02\u573A\u3002' },
    'pr.tw3Title':      { en: '1941\u20131945', zh: '1941\u20131945\u5E74' },
    'pr.tw3Desc':       { en: 'NCDN closed. Kelly & Walsh fled to Hong Kong. Only Japanese or neutral-capital presses remained operational \u2014 making commercial production of an English game highly unlikely.', zh: '\u5B57\u6797\u897F\u62A5\u505C\u520A\u3002\u522B\u53D1\u6D0B\u884C\u8FC1\u5F80\u9999\u6E2F\u3002\u4EC5\u65E5\u8D44\u6216\u4E2D\u7ACB\u56FD\u5370\u5237\u5382\u7EE7\u7EED\u8FD0\u8425\u2014\u2014\u5546\u4E1A\u5370\u5237\u82F1\u6587\u6E38\u620F\u7684\u53EF\u80FD\u6027\u6781\u4F4E\u3002' },
    'pr.nextTitle':     { en: 'Next Investigation Steps', zh: '\u4E0B\u4E00\u6B65\u8C03\u67E5' },
    'pr.next1':         { en: '<strong>Download the Hong List Excel</strong> (Zenodo DOI: <a href="https://doi.org/10.5281/zenodo.4008398" target="_blank">10.5281/zenodo.4008398</a>) \u2192 filter for all "print"/"printing"/"press" entries \u2192 build complete printer directory', zh: '<strong>\u4E0B\u8F7D\u884C\u540D\u8F9E\u5178 Excel</strong>\uFF08Zenodo DOI: <a href="https://doi.org/10.5281/zenodo.4008398" target="_blank">10.5281/zenodo.4008398</a>\uFF09\u2192 \u7B5B\u9009\u6240\u6709\u201Cprint\u201D/\u201Cprinting\u201D/\u201Cpress\u201D\u6761\u76EE \u2192 \u5EFA\u7ACB\u5B8C\u6574\u5370\u5237\u5382\u76EE\u5F55' },
    'pr.next2':         { en: '<strong>Examine Millington Ltd. archives</strong> \u2192 confirm whether printing services extended to games/paper products', zh: '<strong>\u67E5\u9605\u7F8E\u7075\u767B\u516C\u53F8\u6863\u6848</strong> \u2192 \u786E\u8BA4\u5370\u5237\u670D\u52A1\u662F\u5426\u6269\u5C55\u5230\u6E38\u620F/\u7EB8\u5236\u54C1' },
    'pr.next3':         { en: '<strong>Check Cuihua Card Factory product catalog</strong> \u2192 look for English-language game commissions', zh: '<strong>\u68C0\u67E5\u7CB9\u534E\u5361\u7247\u5382\u4EA7\u54C1\u76EE\u5F55</strong> \u2192 \u5BFB\u627E\u82F1\u6587\u6E38\u620F\u8BA2\u5355' },
    'pr.next4':         { en: '<strong>Trace Wing On\'s supply chain</strong> \u2192 who supplied their imported/foreign toys and games?', zh: '<strong>\u8FFD\u8E2A\u6C38\u5B89\u767E\u8D27\u4F9B\u8D27\u94FE</strong> \u2192 \u8C01\u5411\u4ED6\u4EEC\u4F9B\u5E94\u8FDB\u53E3/\u5916\u56FD\u73A9\u5177\u548C\u6E38\u620F\uFF1F' },
    'pr.next5':         { en: '<strong>Inspect the white label on the board back</strong> \u2192 if it contains text, it may directly identify the printer', zh: '<strong>\u68C0\u67E5\u68CB\u76D8\u80CC\u9762\u767D\u8272\u6807\u7B7E</strong> \u2192 \u5982\u5305\u542B\u6587\u5B57\uFF0C\u53EF\u80FD\u76F4\u63A5\u8BC6\u522B\u5370\u5237\u5382' },
    'pr.next6':         { en: '<strong>Search 1938\u20131940 North-China Herald ads</strong> \u2192 may find retail advertisements for Shanghai Millionaire', zh: '<strong>\u641C\u7D221938-1940\u5E74\u300A\u5B57\u6797\u897F\u62A5\u300B\u5E7F\u544A</strong> \u2192 \u53EF\u80FD\u627E\u5230\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7684\u96F6\u552E\u5E7F\u544A' },
    'pr.next7':         { en: '<strong>Contact Kent McKeever</strong> \u2192 the Shanghai historian who analyzed the production scale on World of Monopoly', zh: '<strong>\u8054\u7CFB Kent McKeever</strong> \u2192 \u8FD9\u4F4D\u4E0A\u6D77\u5386\u53F2\u5B66\u5BB6\u5728 World of Monopoly \u4E0A\u5206\u6790\u4E86\u751F\u4EA7\u89C4\u6A21' },
    'pr.footer':        { en: 'Shanghai Millionaire Research Project \u00B7 Ian \u00B7 NYU Shanghai \u00B7 2026', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7814\u7A76\u9879\u76EE \u00B7 Ian \u00B7 \u7EBD\u7EA6\u5927\u5B66\u4E0A\u6D77 \u00B7 2026' },

    // ===== CAMPS =====
    'ca.eyebrow':       { en: 'Research Track 03', zh: '\u7814\u7A76\u8F68\u9053 03' },
    'ca.title':         { en: 'Camps & Refugees', zh: '\u96C6\u4E2D\u8425\u4E0E\u96BE\u6C11' },
    'ca.lead':          { en: 'Internment camps, the Hongkew Ghetto, and games as wartime survival.', zh: '\u65E5\u519B\u96C6\u4E2D\u8425\u3001\u8679\u53E3\u9694\u90FD\uFF0C\u4EE5\u53CA\u6E38\u620F\u4F5C\u4E3A\u6218\u65F6\u751F\u5B58\u624B\u6BB5\u3002' },
    'ca.campsTitle':    { en: 'Japanese Internment Camps (1943\u20131945)', zh: '\u65E5\u519B\u96C6\u4E2D\u8425\uFF081943\u20131945\uFF09' },
    'ca.campsIntro':    { en: 'After Pearl Harbor (December 1941), Japan occupied Shanghai\'s International Settlement. In January 1943, the Japanese military government began concentrating Allied civilians \u2014 British, American, Dutch, Australian, and others \u2014 into designated camps across Shanghai. Approximately <strong>12,000 people</strong> were interned in at least 20 facilities.', zh: '\u73CD\u73E0\u6E2F\u4E8B\u4EF6\u540E\uFF081941\u5E7412\u6708\uFF09\uFF0C\u65E5\u519B\u5360\u9886\u4E0A\u6D77\u516C\u5171\u79DF\u754C\u3002\u00A01943\u5E741\u6708\uFF0C\u65E5\u519B\u5F00\u59CB\u5C06\u76DF\u519B\u5E73\u6C11\u2014\u2014\u82F1\u56FD\u4EBA\u3001\u7F8E\u56FD\u4EBA\u3001\u8377\u5170\u4EBA\u3001\u6FB3\u5927\u5229\u4E9A\u4EBA\u7B49\u2014\u2014\u96C6\u4E2D\u5230\u4E0A\u6D77\u5404\u5730\u7684\u6307\u5B9A\u8425\u5730\u3002\u7EA6<strong>12,000\u4EBA</strong>\u88AB\u62D8\u7981\u5728\u81F3\u5C1120\u4E2A\u8BBE\u65BD\u4E2D\u3002' },
    'ca.camp1Title':    { en: 'Lunghua Civilian Assembly Centre', zh: '\u9F99\u534E\u5E73\u6C11\u96C6\u4E2D\u8425' },
    'ca.camp1Aka':      { en: '\u539F\u6C5F\u82CF\u4E2D\u5B66\u65E7\u5740\uFF08\u4ECA\u4E0A\u6D77\u4E2D\u5B66\uFF09', zh: '\u539F\u6C5F\u82CF\u4E2D\u5B66\u65E7\u5740\uFF08\u4ECA\u4E0A\u6D77\u4E2D\u5B66\uFF09' },
    'ca.camp1Inter':    { en: 'Internees', zh: '\u88AB\u62D8\u7981\u8005' },
    'ca.camp1InterV':   { en: '~1,988 (from 11 nations)', zh: '\u7EA61,988\u4EBA\uFF0811\u4E2A\u56FD\u5BB6\uFF09' },
    'ca.camp1Period':   { en: 'Period', zh: '\u65F6\u95F4' },
    'ca.camp1PeriodV':  { en: 'March 1943 \u2013 August 1945', zh: '1943\u5E743\u6708 \u2013 1945\u5E748\u6708' },
    'ca.camp1Note':     { en: 'Notable', zh: '\u8457\u540D\u5173\u8054' },
    'ca.camp1NoteV':    { en: 'J.G. Ballard\'s <em>Empire of the Sun</em>', zh: 'J.G. Ballard\u300A\u5E1D\u56FD\u7684\u592A\u9633\u300B' },
    'ca.camp1Desc':     { en: 'The most documented camp. Internees organized a school (Lunghwa Academy, ~350 children), jazz bands, theater, and scouting activities.', zh: '\u8BB0\u5F55\u6700\u5B8C\u6574\u7684\u8425\u5730\u3002\u88AB\u62D8\u7981\u8005\u7EC4\u7EC7\u4E86\u5B66\u6821\uFF08\u9F99\u534E\u5B66\u9662\uFF0C\u7EA6350\u540D\u513F\u7AE5\uFF09\u3001\u7235\u58EB\u4E50\u961F\u3001\u620F\u5267\u548C\u7AE5\u5B50\u519B\u6D3B\u52A8\u3002' },
    'ca.camp2Title':    { en: 'Pootung Civilian Assembly Centre', zh: '\u6D66\u4E1C\u5E73\u6C11\u96C6\u4E2D\u8425' },
    'ca.camp2Aka':      { en: '\u6D66\u4E1C\u5E73\u6C11\u96C6\u5408\u4E2D\u5FC3', zh: '\u6D66\u4E1C\u5E73\u6C11\u96C6\u5408\u4E2D\u5FC3' },
    'ca.camp2InterV':   { en: '~1,500', zh: '\u7EA61,500\u4EBA' },
    'ca.camp2PeriodV':  { en: 'January 1943 \u2013 August 1945', zh: '1943\u5E741\u6708 \u2013 1945\u5E748\u6708' },
    'ca.camp2Cond':     { en: 'Conditions', zh: '\u6761\u4EF6' },
    'ca.camp2CondV':    { en: 'Among the harshest \u2014 food described as "rotten, sour, containing insects"', zh: '\u6700\u6076\u52A3\u4E4B\u4E00\u2014\u2014\u98DF\u7269\u88AB\u63CF\u8FF0\u4E3A\u201C\u8150\u70C2\u3001\u53D1\u9178\u3001\u542B\u6709\u6B8B\u7559\u7269\u201D' },
    'ca.camp3Title':    { en: 'Ash Camp', zh: '\u7070\u8425' },
    'ca.camp3Aka':      { en: '\u5927\u897F\u8DEF63\u53F7', zh: '\u5927\u897F\u8DEF63\u53F7' },
    'ca.camp3InterV':   { en: '~456', zh: '\u7EA6456\u4EBA' },
    'ca.camp3PeriodV':  { en: 'March 1943 \u2013 August 1945', zh: '1943\u5E743\u6708 \u2013 1945\u5E748\u6708' },
    'ca.camp3Origin':   { en: 'Name origin', zh: '\u540D\u79F0\u6765\u6E90' },
    'ca.camp3OriginV':  { en: 'Named for the ash fill on the site', zh: '\u56E0\u573A\u5730\u7684\u7070\u6E23\u586B\u5145\u800C\u5F97\u540D' },
    'ca.camp4Title':    { en: 'Chapei Camp', zh: '\u95F8\u5317\u96C6\u4E2D\u8425' },
    'ca.camp4Aka':      { en: '\u95F8\u5317\u5E73\u6C11\u96C6\u5408\u4E2D\u5FC3', zh: '\u95F8\u5317\u5E73\u6C11\u96C6\u5408\u4E2D\u5FC3' },
    'ca.camp4InterV':   { en: '~456', zh: '\u7EA6456\u4EBA' },
    'ca.camp4PeriodV':  { en: '1943\u20131945', zh: '1943\u20131945\u5E74' },
    'ca.cultureTitle':  { en: 'Games & Culture in the Camps', zh: '\u96C6\u4E2D\u8425\u4E2D\u7684\u6E38\u620F\u4E0E\u6587\u5316' },
    'ca.cultureIntro':  { en: 'Despite brutal conditions, internees organized remarkably rich cultural lives \u2014 a survival mechanism documented across multiple camps:', zh: '\u5C3D\u7BA1\u6761\u4EF6\u6076\u52A3\uFF0C\u88AB\u62D8\u7981\u8005\u7EC4\u7EC7\u4E86\u4E30\u5BCC\u7684\u6587\u5316\u751F\u6D3B\u2014\u2014\u8FD9\u662F\u591A\u4E2A\u8425\u5730\u8BB0\u5F55\u7684\u751F\u5B58\u673A\u5236\uFF1A' },
    'ca.culLi1':        { en: '<strong>Lunghwa Academy</strong> \u2014 Herbert Huckstep and others established a school for ~350 children, using brown paper bags as writing materials', zh: '<strong>\u9F99\u534E\u5B66\u9662</strong> \u2014 Herbert Huckstep \u7B49\u4EBA\u4E3A\u7EA6350\u540D\u513F\u7AE5\u5EFA\u7ACB\u5B66\u6821\uFF0C\u7528\u68D5\u8272\u7EB8\u888B\u4F5C\u4E3A\u4E66\u5199\u6750\u6599' },
    'ca.culLi2':        { en: '<strong>Jazz bands</strong> \u2014 Professional musicians from Shanghai\'s dance halls formed ensembles, playing standards like <em>There\'ll Be Some Changes Made</em> and <em>Nagasaki</em>', zh: '<strong>\u7235\u58EB\u4E50\u961F</strong> \u2014 \u6765\u81EA\u4E0A\u6D77\u821E\u5385\u7684\u804C\u4E1A\u4E50\u624B\u7EC4\u5EFA\u4E86\u4E50\u961F\uFF0C\u6F14\u594F\u300AThere\'ll Be Some Changes Made\u300B\u7B49\u66F2\u76EE' },
    'ca.culLi3':        { en: '<strong>Bridge tournaments, lectures, theatrical performances</strong> \u2014 Betty Barr recalled earning her Girl Guide camping badge as "the happiest yet most ironic memory"', zh: '<strong>\u6865\u724C\u8D5B\u3001\u8BB2\u5EA7\u3001\u620F\u5267\u8868\u6F14</strong> \u2014 Betty Barr \u56DE\u5FC6\u83B7\u5F97\u5973\u7AE5\u5B50\u519B\u9732\u8425\u5FBD\u7AE0\u662F\u201C\u6700\u5FEB\u4E50\u4E5F\u6700\u8BDA\u523A\u7684\u8BB0\u5FC6\u201D' },
    'ca.culLi4':        { en: '<strong>Secret radios</strong> \u2014 Two hidden radios in Lunghua camp allowed internees to follow war news', zh: '<strong>\u79D8\u5BC6\u6536\u97F3\u673A</strong> \u2014 \u9F99\u534E\u8425\u5185\u7684\u4E24\u53F0\u85CF\u533F\u6536\u97F3\u673A\u8BA9\u88AB\u62D8\u7981\u8005\u80FD\u8DDF\u8E2A\u6218\u4E89\u6D88\u606F' },
    'ca.cultureEnd':    { en: 'This cultural resilience provides the context for understanding why the Lobel brothers would spend effort making a board game in 1946 \u2014 even after liberation, the habit of creating entertainment from nothing persisted.', zh: '\u8FD9\u79CD\u6587\u5316\u97E7\u6027\u4E3A\u7406\u89E3 Lobel \u5144\u5F1F\u4E3A\u4F55\u57281946\u5E74\u82B1\u7CBE\u529B\u5236\u4F5C\u68CB\u76D8\u6E38\u620F\u63D0\u4F9B\u4E86\u80CC\u666F\u2014\u2014\u5373\u4F7F\u89E3\u653E\u540E\uFF0C\u4ECE\u65E0\u5230\u6709\u521B\u9020\u5A31\u4E50\u7684\u4E60\u60EF\u4ECD\u7136\u5B58\u5728\u3002' },
    'ca.ghettoTitle':   { en: 'The Hongkew Ghetto', zh: '\u8679\u53E3\u9694\u90FD' },
    'ca.ghettoIntro':   { en: 'In parallel with the Allied internment camps, approximately <strong>20,000 Jewish refugees</strong> from Germany, Austria, and Poland lived in Shanghai \u2014 most in the Hongkew (\u8679\u53E3) district. After February 1943, Japan designated a "Restricted Area for Stateless Refugees" (\u65E0\u56FD\u7C4D\u96BE\u6C11\u6307\u5B9A\u533A\u57DF), effectively creating a ghetto.', zh: '\u4E0E\u76DF\u519B\u96C6\u4E2D\u8425\u5E76\u884C\uFF0C\u7EA6<strong>20,000\u540D\u72B9\u592A\u96BE\u6C11</strong>\u4ECE\u5FB7\u56FD\u3001\u5965\u5730\u5229\u548C\u6CE2\u5170\u6765\u5230\u4E0A\u6D77\u2014\u2014\u5927\u90E8\u5206\u4F4F\u5728\u8679\u53E3\u533A\u3002\u00A01943\u5E742\u6708\u540E\uFF0C\u65E5\u519B\u5212\u5B9A\u201C\u65E0\u56FD\u7C4D\u96BE\u6C11\u6307\u5B9A\u533A\u57DF\u201D\uFF0C\u5B9E\u8D28\u4E0A\u5F62\u6210\u4E86\u9694\u90FD\u3002' },
    'ca.ghStat1Num':    { en: '~1 sq mi', zh: '\u7EA61\u5E73\u65B9\u82F1\u91CC' },
    'ca.ghStat1Label':  { en: 'Designated area', zh: '\u6307\u5B9A\u533A\u57DF' },
    'ca.ghStat2Num':    { en: '14,245', zh: '14,245' },
    'ca.ghStat2Label':  { en: 'Jewish refugees confined', zh: '\u88AB\u9650\u5236\u7684\u72B9\u592A\u96BE\u6C11' },
    'ca.ghStat3Num':    { en: '~100,000', zh: '\u7EA6100,000' },
    'ca.ghStat3Label':  { en: 'Chinese residents in same area', zh: '\u540C\u4E00\u533A\u57DF\u4E2D\u56FD\u5C45\u6C11' },
    'ca.ghetto1':       { en: 'Life in the Hongkew Ghetto was constrained but not as tightly controlled as the internment camps. Refugees could sometimes leave for work (with passes), and a rich community life developed: the Kadoorie School educated 500+ children, three German-language newspapers were published, and cultural events flourished.', zh: '\u8679\u53E3\u9694\u90FD\u7684\u751F\u6D3B\u53D7\u9650\u4F46\u4E0D\u5982\u96C6\u4E2D\u8425\u4E25\u683C\u3002\u96BE\u6C11\u6709\u65F6\u53EF\u4EE5\u51ED\u901A\u884C\u8BC1\u79BB\u5F00\u5DE5\u4F5C\uFF0C\u793E\u533A\u751F\u6D3B\u4E30\u5BCC\uFF1A\u5609\u9053\u91CC\u5B66\u6821\u6559\u80B2\u4E86500\u540D\u513F\u7AE5\uFF0C\u4E09\u4EFD\u5FB7\u8BED\u62A5\u7EB8\u51FA\u7248\uFF0C\u6587\u5316\u6D3B\u52A8\u7E41\u8363\u3002' },
    'ca.ghetto2':       { en: 'The <strong>Lobel family</strong> \u2014 Siegfried and Manfred\'s parents \u2014 fled Berlin in September 1940 and were forced into the Hongkew designated area in 1942. The boys\' 1946 hand-drawn Shanghai Millionaire was made <em>after</em> liberation, using surplus US Army K-ration boxes \u2014 a material artifact of their displaced lives.', zh: '<strong>Lobel\u5BB6\u65CF</strong>\u2014\u2014Siegfried\u548CManfred\u7684\u7236\u6BCD\u2014\u2014\u4E8E1940\u5E749\u6708\u4ECE\u67CF\u6797\u9003\u4EA1\uFF0C1942\u5E74\u88AB\u8FEB\u8FDB\u5165\u8679\u53E3\u6307\u5B9A\u533A\u57DF\u3002\u5144\u5F1F\u4FE91946\u5E74\u624B\u7ED8\u7684\u4E0A\u6D77\u5927\u5BCC\u7FC1\u662F\u5728\u89E3\u653E<em>\u4E4B\u540E</em>\u7528\u7F8E\u519B\u53E3\u7CAE\u7BB1\u5236\u4F5C\u7684\u2014\u2014\u662F\u4ED6\u4EEC\u6D41\u79BB\u751F\u6D3B\u7684\u7269\u8D28\u9057\u5B58\u3002' },
    'ca.assessTitle':   { en: 'Could Shanghai Millionaire Have Entered the Camps?', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u53EF\u80FD\u8FDB\u5165\u96C6\u4E2D\u8425\u5417\uFF1F' },
    'ca.against':       { en: 'Against', zh: '\u53CD\u5BF9' },
    'ca.for':           { en: 'For', zh: '\u652F\u6301' },
    'ca.aLi1':          { en: 'Japanese authorities confiscated personal belongings upon internment \u2014 non-essentials were seized', zh: '\u65E5\u519B\u5F53\u5C40\u5728\u62D8\u7981\u65F6\u6CA1\u6536\u4E2A\u4EBA\u7269\u54C1\u2014\u2014\u975E\u5FC5\u9700\u54C1\u88AB\u6263\u62BC' },
    'ca.aLi2':          { en: 'Internees prioritized food, clothing, medicine over games', zh: '\u88AB\u62D8\u7981\u8005\u4F18\u5148\u643A\u5E26\u98DF\u7269\u3001\u8863\u7269\u3001\u836F\u54C1\u800C\u975E\u6E38\u620F' },
    'ca.aLi3':          { en: 'Overcrowded living quarters left no space for large board games', zh: '\u62E5\u6324\u7684\u5C45\u4F4F\u7A7A\u95F4\u65E0\u5BB9\u7EB3\u5927\u578B\u68CB\u76D8\u6E38\u620F' },
    'ca.aLi4':          { en: 'Commercial production ceased by ~1940; the game was already scarce by 1943', zh: '\u5546\u4E1A\u7248\u7EA61940\u5E74\u505C\u4EA7\uFF1B\u52301943\u5E74\u5DF2\u5F88\u7A00\u7F3A' },
    'ca.aLi5':          { en: 'No direct documentary or physical evidence found', zh: '\u65E0\u76F4\u63A5\u6587\u732E\u6216\u5B9E\u7269\u8BC1\u636E' },
    'ca.fLi1':          { en: 'Strong entertainment need in camps \u2014 internees organized bridge, theater, music', zh: '\u8425\u5730\u5A31\u4E50\u9700\u6C42\u5F3A\u70C8\u2014\u2014\u88AB\u62D8\u7981\u8005\u7EC4\u7EC7\u6865\u724C\u3001\u620F\u5267\u3001\u97F3\u4E50' },
    'ca.fLi2':          { en: '~350 children in Lunghwa alone needed activities', zh: '\u4EC5\u9F99\u534E\u8425\u5C31\u6709\u7EA6350\u540D\u513F\u7AE5\u9700\u8981\u6D3B\u52A8' },
    'ca.fLi3':          { en: 'The handmade Lobel copy proves the <em>desire</em> for games existed in the refugee community', zh: 'Lobel\u624B\u5DE5\u7248\u8BC1\u660E\u96BE\u6C11\u793E\u533A\u5B58\u5728\u5BF9\u6E38\u620F\u7684<em>\u6E34\u671B</em>' },
    'ca.fLi4':          { en: 'Board size (48.5cm\u00B2) is relatively portable', zh: '\u68CB\u76D8\u5C3A\u5BF8\uFF0848.5cm\u00B2\uFF09\u76F8\u5BF9\u4FBF\u643A' },
    'ca.callout':       { en: '<strong>Assessment:</strong> Commercial Shanghai Millionaire entering the internment camps is <strong>unlikely (20\u201330%)</strong>. However, the possibility of internees <em>improvising similar games</em> from memory is moderate (40\u201350%), consistent with documented cultural activities.', zh: '<strong>\u8BC4\u4F30\uFF1A</strong>\u5546\u4E1A\u7248\u4E0A\u6D77\u5927\u5BCC\u7FC1\u8FDB\u5165\u96C6\u4E2D\u8425\u7684\u53EF\u80FD\u6027<strong>\u8F83\u4F4E\uFF0820-30%\uFF09</strong>\u3002\u4F46\u88AB\u62D8\u7981\u8005<em>\u51ED\u8BB0\u5FC6\u5373\u5174\u5236\u4F5C\u7C7B\u4F3C\u6E38\u620F</em>\u7684\u53EF\u80FD\u6027\u4E2D\u7B49\uFF0840-50%\uFF09\uFF0C\u4E0E\u5DF2\u8BB0\u5F55\u7684\u6587\u5316\u6D3B\u52A8\u4E00\u81F4\u3002' },
    'ca.footer':        { en: 'Shanghai Millionaire Research Project \u00B7 Ian \u00B7 NYU Shanghai \u00B7 2026', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7814\u7A76\u9879\u76EE \u00B7 Ian \u00B7 \u7EBD\u7EA6\u5927\u5B66\u4E0A\u6D77 \u00B7 2026' },

    // ===== RESOURCES =====
    'res.eyebrow':      { en: 'Research Track 04', zh: '\u7814\u7A76\u8F68\u9053 04' },
    'res.title':        { en: 'Resources', zh: '\u7814\u7A76\u8D44\u6E90' },
    'res.lead':         { en: 'Archives, databases, maps, and key references for Shanghai Millionaire research.', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7814\u7A76\u7684\u6863\u6848\u3001\u6570\u636E\u5E93\u3001\u5730\u56FE\u548C\u5173\u952E\u53C2\u8003\u6587\u732E\u3002' },
    'res.archives':     { en: 'Archives & Databases', zh: '\u6863\u6848\u4E0E\u6570\u636E\u5E93' },
    'res.r1Desc':       { en: 'Lobel brothers\' Shanghai Millionaire \u2014 catalog entry with collection details and Holocaust-era context.', zh: 'Lobel\u5144\u5F1F\u7684\u4E0A\u6D77\u5927\u5BCC\u7FC1\u2014\u2014\u542B\u9970\u54C1\u8BE6\u60C5\u548C\u5927\u5C60\u6740\u65F6\u671F\u80CC\u666F\u7684\u76EE\u5F55\u6761\u76EE\u3002' },
    'res.r2Desc':       { en: 'Albert C. Veldhuis\'s detailed documentation of the commercial Shanghai Millionaire edition, with physical description and provenance.', zh: 'Albert C. Veldhuis \u5BF9\u5546\u4E1A\u7248\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7684\u8BE6\u7EC6\u8BB0\u5F55\uFF0C\u542B\u5B9E\u7269\u63CF\u8FF0\u548C\u6D41\u4F20\u53F2\u3002' },
    'res.r3Desc':       { en: 'Ralph Harpuder\'s personal recollection of playing Shanghai Millionaire as a child in Shanghai. Identifies Wing On as a retail point.', zh: 'Ralph Harpuder \u5BF9\u513F\u65F6\u5728\u4E0A\u6D77\u73A9\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7684\u4E2A\u4EBA\u56DE\u5FC6\u3002\u786E\u8BA4\u6C38\u5B89\u767E\u8D27\u4E3A\u96F6\u552E\u70B9\u3002' },
    'res.r4Desc':       { en: 'American Jewish Joint Distribution Committee\'s records on Shanghai refugee operations, 1938\u20131953. Includes photographs and organizational records.', zh: '\u7F8E\u56FD\u72B9\u592A\u8054\u5408\u5206\u914D\u59D4\u5458\u4F1A1938-1953\u5E74\u4E0A\u6D77\u96BE\u6C11\u6551\u52A9\u8BB0\u5F55\uFF0C\u542B\u7167\u7247\u548C\u7EC4\u7EC7\u8BB0\u5F55\u3002' },
    'res.r5Desc':       { en: 'Christian Henriot\'s digital humanities project with historical maps of Shanghai, including a 1935\u20131940 printing press distribution map (ID: 876).', zh: 'Christian Henriot \u7684\u6570\u5B57\u4EBA\u6587\u9879\u76EE\uFF0C\u542B\u4E0A\u6D77\u5386\u53F2\u5730\u56FE\uFF0C\u5305\u62EC1935-1940\u5E74\u5370\u5237\u5382\u5206\u5E03\u56FE\uFF08ID: 876\uFF09\u3002' },
    'res.r6Desc':       { en: 'Complete business directory of Shanghai (Excel, 2.6MB). Searchable by "print"/"printing"/"press" to identify all registered printing companies. CC-BY 4.0.', zh: '\u4E0A\u6D77\u5B8C\u6574\u5546\u4E1A\u540D\u5F55\uFF08Excel, 2.6MB\uFF09\u3002\u53EF\u6309\u201Cprint\u201D/\u201Cprinting\u201D/\u201Cpress\u201D\u7B5B\u9009\u6240\u6709\u6CE8\u518C\u5370\u5237\u4F01\u4E1A\u3002CC-BY 4.0\u3002' },
    'res.r7Desc':       { en: 'Houses the Lobel brothers\' handmade Shanghai Millionaire (Accession 2009.106.1 / IRN 37343). Searchable online catalog.', zh: '\u85CF\u6709 Lobel \u5144\u5F1F\u624B\u5DE5\u7248\u4E0A\u6D77\u5927\u5BCC\u7FC1\uFF08\u7F16\u53F7 2009.106.1 / IRN 37343\uFF09\u3002\u53EF\u5728\u7EBF\u68C0\u7D22\u3002' },
    'res.r8Desc':       { en: 'Full digital archive of Shanghai\'s most influential English newspaper (1864\u20131950, with wartime break). Potential source for retail advertisements of Shanghai Millionaire.', zh: '\u4E0A\u6D77\u6700\u5177\u5F71\u54CD\u529B\u7684\u82F1\u6587\u62A5\u7EB8\u5B8C\u6574\u6570\u5B57\u6863\u6848\uFF081864-1950\u5E74\uFF0C\u542B\u6218\u65F6\u4E2D\u65AD\uFF09\u3002\u53EF\u80FD\u627E\u5230\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7684\u96F6\u552E\u5E7F\u544A\u3002' },
    'res.refsTitle':    { en: 'Key References', zh: '\u5173\u952E\u53C2\u8003\u6587\u732E' },
    'res.refsSub1':     { en: 'Books & Academic Works', zh: '\u4E66\u7C4D\u4E0E\u5B66\u672F\u8457\u4F5C' },
    'res.ref1':         { en: 'Reed, Christopher A. <em>Gutenberg in Shanghai: Chinese Print Capitalism, 1876\u20131937</em>. Vancouver: UBC Press, 2004. \u2014 The definitive study of Shanghai\'s printing industry; essential for understanding the printer candidates.', zh: 'Reed, Christopher A. <em>Gutenberg in Shanghai: Chinese Print Capitalism, 1876\u20131937</em>. Vancouver: UBC Press, 2004. \u2014 \u4E0A\u6D77\u5370\u5237\u4E1A\u7684\u6743\u5A01\u7814\u7A76\uFF1B\u7406\u89E3\u5019\u9009\u5370\u5237\u5382\u7684\u5FC5\u8BFB\u4E4B\u4F5C\u3002' },
    'res.ref2':         { en: 'Henchion, Paul. <em>The Shanghai Millionaire</em>. In: various collector publications. \u2014 Secondary literature on the game itself.', zh: 'Henchion, Paul. <em>The Shanghai Millionaire</em>. \u6536\u5F55\u4E8E\uFF1A\u5404\u6536\u85CF\u5BB6\u51FA\u7248\u7269\u3002\u2014 \u5173\u4E8E\u6E38\u620F\u672C\u8EAB\u7684\u4E8C\u624B\u6587\u732E\u3002' },
    'res.ref3':         { en: 'Barr, Betty. Personal recollections of Lunghua Civilian Assembly Centre. \u2014 Primary source on camp cultural life.', zh: 'Barr, Betty. \u9F99\u534E\u5E73\u6C11\u96C6\u4E2D\u8425\u4E2A\u4EBA\u56DE\u5FC6\u5F55\u3002\u2014 \u8425\u5730\u6587\u5316\u751F\u6D3B\u7684\u4E00\u624B\u8D44\u6599\u3002' },
    'res.ref4':         { en: 'Ma, Changlin \u9A6C\u957F\u6797. <em>\u8001\u4E0A\u6D77\u884C\u540D\u8F9E\u5178 1880\u20131941</em> (English-Chinese Hong List of Old Shanghai). Shanghai: Shanghai Ancient Books Publishing House, 2008. \u2014 The source of the Zenodo business directory dataset.', zh: '\u9A6C\u957F\u6797. <em>\u8001\u4E0A\u6D77\u884C\u540D\u8F9E\u5178 1880\u20131941</em>. \u4E0A\u6D77\uFF1A\u4E0A\u6D77\u53E4\u7C4D\u51FA\u7248\u793E\uFF0C2008\u5E74\u3002\u2014 Zenodo\u5546\u4E1A\u540D\u5F55\u6570\u636E\u96C6\u7684\u6765\u6E90\u3002' },
    'res.instSub':      { en: 'Institutional Resources', zh: '\u673A\u6784\u8D44\u6E90' },
    'res.inst1':        { en: 'Shanghai Library (\u4E0A\u6D77\u56FE\u4E66\u9986) \u2014 Xujiahui Bibliotheca Zi-Ka-Wei (\u5F90\u5BB6\u6C47\u85CF\u4E66\u697C): holds original Hong Lists and commercial registration archives', zh: '\u4E0A\u6D77\u56FE\u4E66\u9986 \u2014 \u5F90\u5BB6\u6C47\u85CF\u4E66\u697C\uFF1A\u85CF\u6709\u539F\u7248\u884C\u540D\u5F55\u548C\u5546\u4E1A\u767B\u8BB0\u6863\u6848' },
    'res.inst2':        { en: 'Shanghai Municipal Archives (\u4E0A\u6D77\u5E02\u6863\u6848\u9986): business registration records for foreign companies in the International Settlement', zh: '\u4E0A\u6D77\u5E02\u6863\u6848\u9986\uFF1A\u516C\u5171\u79DF\u754C\u5916\u56FD\u516C\u53F8\u7684\u5546\u4E1A\u767B\u8BB0\u8BB0\u5F55' },
    'res.inst3':        { en: 'CSUN University Library: Civilian Internment in China, 1941\u20131945 \u2014 statistical data on camp populations', zh: 'CSUN \u5927\u5B66\u56FE\u4E66\u9986\uFF1A\u4E2D\u56FD\u5E73\u6C11\u62D8\u7981 1941-1945 \u2014 \u8425\u5730\u4EBA\u53E3\u7EDF\u8BA1\u6570\u636E' },
    'res.inst4':        { en: 'Center for Jewish History (CJH): Shanghai Collection \u2014 everyday life of Jewish refugees, 1939\u20131948', zh: '\u72B9\u592A\u5386\u53F2\u4E2D\u5FC3\uFF08CJH\uFF09\uFF1A\u4E0A\u6D77\u85CF\u54C1 \u2014 \u72B9\u592A\u96BE\u6C11\u65E5\u5E38\u751F\u6D3B\uFF0C1939-1948' },
    'res.inst5':        { en: 'Leo Baeck Institute: German-Jewish refugee periodicals from Shanghai', zh: 'Leo Baeck \u7814\u7A76\u6240\uFF1A\u6765\u81EA\u4E0A\u6D77\u7684\u5FB7\u7C4D\u72B9\u592A\u96BE\u6C11\u671F\u520A' },
    'res.onlineSub':    { en: 'Online Collections', zh: '\u5728\u7EBF\u6536\u85CF' },
    'res.onl1':         { en: 'Historical Photographs of China (University of Bristol) \u2014 includes images of Shanghai printing works', zh: '\u4E2D\u56FD\u5386\u53F2\u7167\u7247\uFF08\u5E03\u91CC\u65AF\u6258\u5927\u5B66\uFF09\u2014 \u542B\u4E0A\u6D77\u5370\u5237\u5382\u56FE\u7247' },
    'res.onl2':         { en: 'Virtual Shanghai \u2014 maps, texts, statistical data on historical Shanghai', zh: 'Virtual Shanghai \u2014 \u5386\u53F2\u4E0A\u6D77\u7684\u5730\u56FE\u3001\u6587\u672C\u3001\u7EDF\u8BA1\u6570\u636E' },
    'res.onl3':         { en: 'Industrial History of Hong Kong \u2014 detailed Kelly & Walsh company history', zh: '\u9999\u6E2F\u5DE5\u4E1A\u5386\u53F2 \u2014 \u522B\u53D1\u6D0B\u884C\u516C\u53F8\u8BE6\u7EC6\u5386\u53F2' },
    'res.onl4':         { en: 'Geographicus Rare Antique Maps \u2014 Kelly & Walsh imprints and publication history', zh: 'Geographicus \u73CD\u8D35\u53E4\u5730\u56FE \u2014 \u522B\u53D1\u6D0B\u884C\u5370\u5237\u54C1\u548C\u51FA\u7248\u5386\u53F2' },
    'res.methodTitle':  { en: 'Research Methodology', zh: '\u7814\u7A76\u65B9\u6CD5' },
    'res.m1Title':      { en: 'Material Analysis', zh: '\u7269\u8D28\u5206\u6790' },
    'res.m1Desc':       { en: 'Physical examination of the commercial edition: board construction, printing technique, paper quality, label marks, color palette.', zh: '\u5546\u4E1A\u7248\u7684\u5B9E\u7269\u68C0\u67E5\uFF1A\u68CB\u76D8\u6784\u9020\u3001\u5370\u5237\u6280\u672F\u3001\u7EB8\u5F20\u8D28\u91CF\u3001\u6807\u7B7E\u75D5\u8FF9\u3001\u8272\u5F69\u914D\u7F6E\u3002' },
    'res.m2Title':      { en: 'Archival Research', zh: '\u6863\u6848\u7814\u7A76' },
    'res.m2Desc':       { en: 'Cross-referencing business directories (Hong List), industrial surveys (SMP 1935\u20131940), and newspaper advertisements to narrow printer candidates.', zh: '\u4EA4\u53C9\u6BD4\u5BF9\u5546\u4E1A\u540D\u5F55\uFF08\u884C\u540D\u5F55\uFF09\u3001\u5DE5\u4E1A\u8C03\u67E5\uFF08SMP 1935-1940\uFF09\u548C\u62A5\u7EB8\u5E7F\u544A\u4EE5\u7F29\u5C0F\u5019\u9009\u5370\u5237\u5382\u8303\u56F4\u3002' },
    'res.m3Title':      { en: 'Historical Mapping', zh: '\u5386\u53F2\u5730\u56FE' },
    'res.m3Desc':       { en: 'Using Virtual Shanghai maps and GIS data to locate printing firms within the International Settlement and trace their spatial relationship to retail outlets.', zh: '\u4F7F\u7528 Virtual Shanghai \u5730\u56FE\u548C GIS \u6570\u636E\u5B9A\u4F4D\u79DF\u754C\u5185\u5370\u5237\u4F01\u4E1A\uFF0C\u8FFD\u8E2A\u5176\u4E0E\u96F6\u552E\u5E97\u7684\u7A7A\u95F4\u5173\u7CFB\u3002' },
    'res.m4Title':      { en: 'Comparative Design', zh: '\u6BD4\u8F83\u8BBE\u8BA1' },
    'res.m4Desc':       { en: 'Side-by-side analysis with Waddington\'s London edition to identify production techniques, copying errors, and localization decisions.', zh: '\u4E0E Waddington \u4F26\u6566\u7248\u5E76\u5217\u5206\u6790\uFF0C\u8BC6\u522B\u751F\u4EA7\u6280\u672F\u3001\u590D\u5236\u9519\u8BEF\u548C\u672C\u5730\u5316\u51B3\u7B56\u3002' },
    'res.footer':       { en: 'Shanghai Millionaire Research Project \u00B7 Ian \u00B7 NYU Shanghai \u00B7 2026', zh: '\u4E0A\u6D77\u5927\u5BCC\u7FC1\u7814\u7A76\u9879\u76EE \u00B7 Ian \u00B7 \u7EBD\u7EA6\u5927\u5B66\u4E0A\u6D77 \u00B7 2026' }
  };

  // Get current language
  function getLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    return DEFAULT_LANG;
  }

  // Set language
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang(lang);
  }

  // Apply translations
  function applyLang(lang) {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (T[key] && T[key][lang] !== undefined) {
        els[i].innerHTML = T[key][lang];
      }
    }
    // Update html lang attribute
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    // Update the language toggle button text
    var btn = document.querySelector('.lang-toggle');
    if (btn) {
      btn.textContent = lang === 'en' ? '中文' : 'EN';
    }
  }

  // Toggle language
  function toggleLang() {
    var current = getLang();
    setLang(current === 'en' ? 'zh' : 'en');
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    // Bind toggle button
    var btn = document.querySelector('.lang-toggle');
    if (btn) {
      btn.addEventListener('click', toggleLang);
    }
    // Apply saved language
    applyLang(getLang());
  });

  // Expose for debugging
  window.i18n = { getLang: getLang, setLang: setLang, toggleLang: toggleLang };
})();
