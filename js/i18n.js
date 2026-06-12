// ============================================
// i18n — Internationalization Engine
// ============================================

const I18n = (() => {
  let currentLang = localStorage.getItem('app_lang') || 'en';
  let translations = {};
  let loaded = false;

  const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

  async function init() {
    try {
      const [enRes, neRes] = await Promise.all([
        fetch('./i18n/en.json').then(r => r.json()),
        fetch('./i18n/ne.json').then(r => r.json())
      ]);
      translations = { en: enRes, ne: neRes };
      loaded = true;
      applyLanguage();
    } catch (e) {
      console.error('i18n: Failed to load translations', e);
    }
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    translatePage();
    // Update lang toggle button text
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) {
      btn.textContent = lang === 'en' ? 'ने' : 'EN';
    }
  }

  function getLang() {
    return currentLang;
  }

  function t(key) {
    if (!loaded) return key;
    const val = translations[currentLang]?.[key];
    return val !== undefined ? val : (translations['en']?.[key] || key);
  }

  function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
  }

  function applyLanguage() {
    document.documentElement.setAttribute('data-lang', currentLang);
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) {
      btn.textContent = currentLang === 'en' ? 'ने' : 'EN';
    }
  }

  // Convert number to Nepali digits
  function toNepaliDigits(num) {
    return String(num).replace(/[0-9]/g, d => NEPALI_DIGITS[parseInt(d)]);
  }

  // Format number based on current language
  function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    const n = Number(num);
    if (currentLang === 'ne') {
      return toNepaliDigits(n.toLocaleString('en-IN'));
    }
    return n.toLocaleString('en-IN');
  }

  // Format currency
  function formatCurrency(num) {
    if (num === null || num === undefined) num = 0;
    const n = Number(num);
    const formatted = n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (currentLang === 'ne') {
      return `रु. ${toNepaliDigits(formatted)}`;
    }
    return `Rs. ${formatted}`;
  }

  // Format currency without decimals
  function formatCurrencyShort(num) {
    if (num === null || num === undefined) num = 0;
    const n = Number(num);
    const formatted = n.toLocaleString('en-IN');
    if (currentLang === 'ne') {
      return `रु. ${toNepaliDigits(formatted)}`;
    }
    return `Rs. ${formatted}`;
  }

  // Number to words (English)
  function numberToWordsEnglish(num) {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n) {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = convert(intPart) + ' Rupees';
    if (decPart > 0) {
      result += ' and ' + convert(decPart) + ' Paisa';
    }
    result += ' Only';
    return result;
  }

  // Number to words (Nepali)
  function numberToWordsNepali(num) {
    const nepaliOnes = ['', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
      'दश', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस'];
    const nepaliTens = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठी', 'सत्तरी', 'अस्सी', 'नब्बे'];

    function convert(n) {
      if (n < 20) return nepaliOnes[n];
      if (n < 100) return nepaliTens[Math.floor(n / 10)] + (n % 10 ? ' ' + nepaliOnes[n % 10] : '');
      if (n < 1000) return nepaliOnes[Math.floor(n / 100)] + ' सय' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' हजार' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' लाख' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' करोड' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = convert(intPart) + ' रुपैयाँ';
    if (decPart > 0) {
      result += ' र ' + convert(decPart) + ' पैसा';
    }
    result += ' मात्र';
    return result;
  }

  // Get amount in words based on language
  function amountInWords(num) {
    if (currentLang === 'ne') return numberToWordsNepali(num);
    return numberToWordsEnglish(num);
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formatted = d.toLocaleDateString('en-US', options);
    if (currentLang === 'ne') {
      return toNepaliDigits(formatted);
    }
    return formatted;
  }

  return {
    init,
    setLanguage,
    getLang,
    t,
    translatePage,
    formatNumber,
    formatCurrency,
    formatCurrencyShort,
    amountInWords,
    formatDate,
    toNepaliDigits
  };
})();

window.I18n = I18n;
