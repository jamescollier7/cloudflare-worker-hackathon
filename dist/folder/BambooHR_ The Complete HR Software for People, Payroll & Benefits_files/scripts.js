/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// eslint-disable-next-line import/no-cycle
import {
  analyticsTrackCWV,
  analyticsTrackFormSubmission,
  analyticsTrackLinkClicks,
  getAlloyConfiguration,
  analyticsTrackScrollDepth, 
  analyticsTrackPageViews,
} from './lib-analytics.js';
import AnalyticsQueue from "./_classes/analytics-queue.js";

import { setupScrollTracking } from './scroll-tracking.js';

function setBooleanAudienceCookie(cookieName){
  if(!document.cookie.includes(cookieName)){
    document.cookie = `${cookieName}=1;path=/;`;
  }
}

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

const AUDIENCES = {
  'is-customer-ep-ben-admin': () => {
	if(new URLSearchParams(window.location.search).get('epid') === "1"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  'is-customer-ep-payroll': () => {
	if(new URLSearchParams(window.location.search).get('epid') === "2"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  'is-customer-ep-performance-mgmt': () => {
	if(new URLSearchParams(window.location.search).get('epid') === "3"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  'is-customer-ep-time-tracking': () => {
	if(new URLSearchParams(window.location.search).get('epid') === "4"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  /* customer ADMIN */
  'is-customer': () => {
    // eslint-disable-next-line no-use-before-define
    const features = getBhrFeaturesCookie();
    if (!features) { return false; }
    if(features.is_admin && !features.bhr_user) {
      sessionStorage.setItem('bhr_audience_source','Cookie');
      setBooleanAudienceCookie('bhr_audience_customer_admin');
      return true;
    }
    return false;
  },
  'is-customer-non-admin': () => {
	// eslint-disable-next-line no-use-before-define
	const features = getBhrFeaturesCookie();
	if (!features) { return false; }
	if(!features.is_admin && features.bhr_user) {
	  sessionStorage.setItem('bhr_audience_source','Cookie');
      setBooleanAudienceCookie('bhr_audience_customer_non_admin');
	  return true;
	}
	return false;
  },
  'not-customer': () => {
	// eslint-disable-next-line no-use-before-define
    if (!getBhrFeaturesCookie()) {
	  sessionStorage.setItem('bhr_audience_source','Cookie');
      setBooleanAudienceCookie('bhr_audience_non_customer');
	  return true;
	}
    return false;
  },
  'paid-social': () => {
	if(new URLSearchParams(window.location.search).get('utm_medium') === "paid-social"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  'paid-search': () => {
	if(new URLSearchParams(window.location.search).get('utm_medium') === "cpc"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  'review-site': () => {
	if(new URLSearchParams(window.location.search).get('utm_medium') === "review-sites"){
	  sessionStorage.setItem('bhr_audience_source','UTM');
	  return true;
	}
	return false;
  },
  'geo-us':  () => {
	const location = window.geoLocation;
	if(location.country_code === 'US'){
      setBooleanAudienceCookie('bhr_audience_geo_us');
	  return true;
	}
	return false;
  },
  'geo-ca':  () => {
	const location = window.geoLocation;
	if(location.country_code === 'CA'){
      setBooleanAudienceCookie('bhr_audience_geo_ca');
	  return true;
	}
	return false;
  },
  'geo-gb':  () => {
	const location = window.geoLocation;
	if(location.country_code === 'GB'){
      setBooleanAudienceCookie('bhr_audience_geo_gb');
	  return true;
	}
	return false;
  }, 
  'geo-international': () => {
	const location = window.geoLocation;
	if(location.country_code !== 'US'){
      setBooleanAudienceCookie('bhr_audience_geo_int');
	  return true;
	}
	return false;
  },
  'lead-submitter': () => {
	// eslint-disable-next-line no-use-before-define
	if (readCookie('bhr_prefill')) { return true; }
	return false;
  },
  'region-apac': () => {
    const location = window.geoLocation;
    const regionCountries = ["AS", "AU", "BD", "BT", "IO", "BN", "KH", "CN", "CX", "CC", "CK", "FJ", "TF", "HK", "IN", "ID", "JP", "KI", "KP", "KR", "KG", "LA", "MO", "MY", "MV", "MH", "MN", "MM", "NR", "NP", "NC", "NZ", "NU", "NF", "PW", "PG", "PH", "WS", "SG", "SB", "LK", "TW", "TJ", "TH", "TL", "TK", "TO", "TV", "VU", "VN", "WF"];
    if(regionCountries.includes(location.country_code)){
      setBooleanAudienceCookie('bhr_audience_region_apac');
      return true;
    }
    return false;
  },
  'region-emea': () => {
    const location = window.geoLocation;
    const regionCountries = ["AF", "AX", "AL", "DZ", "AD", "AO", "AM", "AT", "AZ", "BH", "BY", "BE", "BJ", "BA", "BW", "BG", "BF", "BI", "CM", "CF", "TD", "KM", "CG", "CD", "CI", "HR", "CY", "CZ", "DK", "DJ", "EG", "GQ", "ER", "EE", "SZ", "ET", "FO", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GG", "GN", "GW", "VA", "HU", "IS", "IR", "IQ", "IE", "IM", "IL", "IT", "JE", "JO", "KZ", "KE", "XK", "KW", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MK", "MG", "MW", "ML", "MT", "MR", "MU", "YT", "MD", "MC", "ME", "MA", "MZ", "NA", "NL", "NE", "NG", "NO", "OM", "PK", "PS", "PL", "PT", "QA", "RE", "RO", "RU", "RW", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SK", "SI", "SO", "ZA", "SS", "ES", "SD", "SE", "CH", "SY", "TZ", "TG", "TN", "TR", "TM", "UG", "UA", "AE", "GB", "UZ", "EH", "YE", "ZM", "ZW"];
    if(regionCountries.includes(location.country_code)){
      setBooleanAudienceCookie('bhr_audience_region_emea');
      return true;
    }
    return false;
  },
  'region-ca-plus': () => {
    const location = window.geoLocation;
    const regionCountries = ["AI", "AG", "AR", "AW", "BS", "BB", "BZ", "BM", "BO", "BO", "BQ", "BR", "CA", "CV", "KY", "CL", "CO", "CR", "CU", "CW", "DM", "DO", "EC", "SV", "FK", "GF", "PF", "GL", "GD", "GP", "GT", "GY", "HT", "HN", "JM", "MQ", "MX", "MS", "NI", "PA", "PY", "PE", "PN", "BL", "KN", "LC", "MF", "PM", "VC", "SX", "GS", "SR", "TT", "TC", "UY", "VE", "VG"];
    if(regionCountries.includes(location.country_code)){
      setBooleanAudienceCookie('bhr_audience_region_ca_plus');
      return true;
    }
    return false;
  },
  'region-other': () => {
    const location = window.geoLocation;
    const regionCountries = ["AQ", "BV", "HM", "SJ", "SH", "CW", "SX", "BQ"];
    if(regionCountries.includes(location.country_code)){
      setBooleanAudienceCookie('bhr_audience_region_other');
      return true;
    }
    return false;
  }, 
  'region-lc': () => {
    const location = window.geoLocation;
    const regionCountries = ["AF", "AL", "DZ", "AD", "AO", "BD", "BY", "BZ", "BW", "BN", "KH", "CM", "CC", "CD", "CK", "CI", "CW", "DO", "EC", "EG", "GQ", "SZ", "FO", "FI", "GM", "GH", "GT", "GN", "HT", "IN", "ID", "IR", "IQ", "JM", "JE", "JO", "KZ", "KE", "KI", "KG", "MG", "MW", "MY", "MV", "ML", "MR", "MD", "MN", "ME", "MA", "MZ", "MM", "NA", "NP", "NI", "NE", "NG", "OM", "PK", "PW", "PS", "PY", "PH", "RU", "KN", "LC", "VC", "SM", "SC", "SL", "SB", "GS", "SS", "LK", "SD", "SR", "SY", "TZ", "TN", "TR", "TV", "UG", "UZ", "VU", "VE", "VN", "ZM", "ZW"];
    if(regionCountries.includes(location.country_code)){
      setBooleanAudienceCookie('bhr_audience_region_lc');
      return true;
    }
    return false;
  },
  'paid-search-desktop': () => {
    if(new URLSearchParams(window.location.search).get('utm_medium') === "cpc" && window.innerWidth >= 600){
      sessionStorage.setItem('bhr_audience_source','UTM');
      return true;
    }
    return false;
  },
  'non-paid-search-mobile': () => {
    if(new URLSearchParams(window.location.search).get('utm_medium') !== "cpc" && window.innerWidth < 600){
      sessionStorage.setItem('bhr_audience_source','UTM');
      return true;
    }
    return false;
  },
  'mobile-viewport': () => {
    if(window.innerWidth < 600){
      sessionStorage.setItem('bhr_audience_source','Viewport');
      return true;
    }
    return false;
  },
  'branded-campaigns': () => {
    
    const brandedCampaignIds = [
      'BAMB-DG-Search_AdAi-2024EG',
      'BAMB-DG-Search-BambooHR-2024EG',
      'BAMB-DG-Search-BambooHRTrademark-2024EG',
      'BAMB-DG-Call-BambooHR-2024EG'
    ];
    if(brandedCampaignIds.includes(new URLSearchParams(window.location.search).get('utm_campaign'))){
        sessionStorage.setItem('bhr_audience_source','UTM');
        return true;
    }    
    return false;
  },
  'non-branded-campaigns': () => {

    const nonBrandedCampaignIds = [
      'BAMB-DG-BG-SER-PRO-2022EG',
      'BAMB-DG-Search-Competitors-MS-2024EG',
      'BAMB-DG-Search-HR-MS-2024EG',
      'BAMB-DG-Search-TopPerformingKW-Non-brandP-E-2024EG',
      'BAMB-DG-SER-PRO-2022EG',
      'BAMBDG-Search-TopPerformingKW-2024EG',
      'BAMB-DG-Search-Onboarding-MS-2024EG',
      'BAMB-DG-Search-HRSoftware-2024EG',
      'BAMB-DG-PerformanceMax-2024EG',
      'BAMB-DG-GOOGLE-2022EG',
    ];    
    if(nonBrandedCampaignIds.includes(new URLSearchParams(window.location.search).get('utm_campaign'))){
      sessionStorage.setItem('bhr_audience_source','UTM');
      return true;
    }
    return false;
  },
  'branded-page': () => {    
    const brandedPage = getMetadata('branded') ?? "";    
    return brandedPage.toLowerCase().trim() === "true";
  },
  'non-branded-page': () => {
    const brandedPage = getMetadata('branded') ?? "";
    return brandedPage.toLowerCase().trim() === "false";
  },
  'desktop': () => window.innerWidth > 1024,
};

export function isAudience(audience) {
  try {
    return AUDIENCES[audience]();
  }catch (e){
    return false;
  }  
}
export async function getAllApplicableAudiences() {
  return Object.values(Object.keys(AUDIENCES).filter((key) => AUDIENCES[key]())).join(', ');
}
/**
 * Gets the value for the specific cookie
 * @param {string} name The name of the cookie
 * @returns {string} the cookie value, or null
 */
export function readCookie(name) {
  const [value] = document.cookie
    .split('; ')
    .filter((cookieString) => cookieString.split('=')[0] === name)
    .map((cookieString) => cookieString.split('=')[1]);
  return value || null;
}

/**
 * Gets the BHR Features from the cookie
 * @returns {object} the BHR features, or an empty object
 */
export function getBhrFeaturesCookie() {
  const value = readCookie('bhr_features');
  try {
    const decryptedValue = atob(value);
    return JSON.parse(decryptedValue);
  } catch (err1) {
    try {
      return JSON.parse(value);
    } catch (err2) {
      return {};
    }
  }
}
export function getUidAndCidFromFeatureCookie() {

  const ids = {uid: null, cid: null};  
  const features = getBhrFeaturesCookie();

  if(features){
      ids.uid = features.lluid ?? null;
      ids.cid = features.llcid ?? null;
  }
    
  return ids;
}

export function getCountryNameByCode(code, countriesJson) {
  const countries = countriesJson.data;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < countries.length; i++) {
    if (countries[i]["2 letter code"] === code) {
      return countries[i].name;
    }
  }
  return "Country not found";
}


export async function geoLookup() {
  const value = readCookie('bhr_geolookup');
  if(value){
	  window.geoLocation = JSON.parse(value);
  }else{
	const resp = await fetch("https://bamboohr.com/geolookup/");
	window.geoLocation = await resp.json();
	document.cookie = `bhr_geolookup=${JSON.stringify(window.geoLocation)};path=/`;
  }
}

/**
 * check if user is BHR customer
 * @returns {boolean}
 */
export function isBhrCustomer() {
  const features = getBhrFeaturesCookie();
  if (features) return features.is_admin && !features.bhr_user;
  return false;
}

/**
 * check if the block audience: matches is-customer or not customer
 * @param {Element} block The block element
 * @returns {boolean}
 */
function matchAudience(block) {
  let matches = true;
  const audiences = [...block.classList].filter(c => c.startsWith('audience-'));
  const audienceTypes = audiences.length ? Object.keys(AUDIENCES) : null;
  audiences.some(i => {
    block.classList.remove(i);

    const audienceType = i.slice(9);
    if (audienceTypes.includes(audienceType)) {
      matches = AUDIENCES[audienceType]()
    } else matches = true;

    return matches;
  });

  return matches;
}

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */
const referrer = new URL(window.location.href);
export function sampleRUM(checkpoint, data = {}) {
  const referrerOverride = window.sessionStorage.getItem('rum-referrer-override');
  if (referrerOverride) {
    Object.defineProperty(document, 'referrer', {
      value: referrerOverride,
      configurable: true
    });
    window.sessionStorage.removeItem('rum-referrer-override');
  }
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname] || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain =
    sampleRUM.drain ||
    ((dfnname, fn) => {
      sampleRUM[dfnname] = fn;
      sampleRUM.defer
        .filter(({ fnname }) => dfnname === fnname)
        .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
    });
  sampleRUM.always = sampleRUM.always || [];
  sampleRUM.always.on = (chkpnt, fn) => {
    sampleRUM.always[chkpnt] = fn;
  };
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  defer('convert');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = usp.get('rum') === 'on' ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random()
        .toString(16)
        .substr(2, 14)}`;
      const random = Math.random();
      const isSelected = random * weight < 1;
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected, sampleRUM };
    }
    const { weight, id } = window.hlx.rum;
    if (window.hlx && window.hlx.rum && window.hlx.rum.isSelected) {
      const sendPing = (pdata = data) => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify(
          {
            weight,
            id,
            referer: referrer.href,
            generation: window.hlx.RUM_GENERATION,
            checkpoint,
            ...data,
          },
          (key, value) => (key === 'element' ? undefined : value)
        );
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    }
    if (sampleRUM.always[checkpoint]) {
      sampleRUM.always[checkpoint](data);
    }
  } catch (error) {
    // something went wrong
  }
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadCSS(href, callback) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    if (typeof callback === 'function') {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
}

/**
 * Loads a non module JS file.
 * @param {string} src URL to the JS file
 * @param {Object} attrs additional optional attributes
 */

export async function loadScript(src, attrs) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

/**
 * Sanitizes a name for use as class name.
 * @param {string} name The unsanitized name
 * @returns {string} The class name
 */
export function toClassName(name) {
  return name && typeof name === 'string' ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-') : '';
}

/**
 * Gets all the metadata elements that are in the given scope.
* @param {String} scope The scope/prefix for the metadata
* @returns an array of HTMLElement nodes that match the given scope
*/
export function getAllMetadata(scope) {
  return [...document.head.querySelectorAll(`meta[property^="${scope}:"],meta[name^="${scope}-"]`)]
    .reduce((res, meta) => {
      const id = toClassName(meta.name
        ? meta.name.substring(scope.length + 1)
        : meta.getAttribute('property').split(':')[1]);
      res[id] = meta.getAttribute('content');
      return res;
    }, {});
}

/**
 * Loads a template specific CSS file.
 */
function loadTemplateCSS() {
  const template = toClassName(getMetadata('template'));
  if (template) {
    const templates = [
      'awareness',
      'bhr-comparison',
      'bhr-home',
      'ee-solution',
      'hr-glossary',
      'hr-software',
      'hr-software-payroll',
      'hr-unplugged',
      'hrvs-listing',
      'hrvs-session',
      'industry',
      'industry-category',
      'live-demo-webinars',
      'performance-reviews',
      'pricing-quote',
      'content-library',
      'webinar',
      'paid-landing-page',
      'paid-landing-page-a',
      'paid-landing-page-b',
      'product-updates',
      'live-demo-webinar-lp',
      'hr-101-guide',
      'customers',
      'trade-show',
      'events',
      'partner',
      'plan-migration-page',
      'customer-homepage'
    ];
    if (templates.includes(template)) {
      const cssBase = `${window.hlx.serverPath}${window.hlx.codeBasePath}`;
      loadCSS(`${cssBase}/styles/templates/${template}.css`);
    }
  }
}

/**
 * Adds one or more URLs to the dependencies for publishing.
 * @param {string|[string]} url The URL(s) to add as dependencies
 */
export function addPublishDependencies(url) {
  const urls = Array.isArray(url) ? url : [url];
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies = window.hlx.dependencies.concat(urls);
  } else {
    window.hlx.dependencies = urls;
  }
}

/*
 * Sanitizes a name for use as a js property name.
 * @param {string} name The unsanitized name
 * @returns {string} The camelCased name
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} element
 */
function replaceIcons(element) {
  element.querySelectorAll('img.icon').forEach((img) => {
    const span = document.createElement('span');
    span.className = img.className;
    img.replaceWith(span);
  });
}

/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} element
 */
export function decorateIcons(element) {
  // prepare for forward compatible icon handling
  replaceIcons(element);

  const missingIcons = [
    'sync-direction-both',
    'sync-direction-right',
    'sync-direction-left'
  ];

  const fetchBase = window.hlx.serverPath;
  element.querySelectorAll('span.icon').forEach((span) => {
    const iconName = span.className.split('icon-')[1];
    if (!missingIcons.includes(iconName)) {
      fetch(`${fetchBase}${window.hlx.codeBasePath}/icons/${iconName}.svg`).then((resp) => {
        if (resp.status === 200)
          resp.text().then((svg) => {
            const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;
            parent.innerHTML = svg;
          });
      });
    }
  });
}

/**
 * Gets placeholders object
 * @param {string} prefix
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  const loaded = window.placeholders[`${prefix}-loaded`];
  if (!loaded) {
    window.placeholders[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      try {
        fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
          .then((resp) => resp.json())
          .then((json) => {
            const placeholders = {};
            json.data.forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
            window.placeholders[prefix] = placeholders;
            resolve();
          });
      } catch (e) {
        // error loading placeholders
        window.placeholders[prefix] = {};
        reject();
      }
    });
  }
  await window.placeholders[`${prefix}-loaded`];
  return window.placeholders[prefix];
}

/**
 * Add default spacing to block.
 * @param {Element} block The block element
 * @param {string} blockName
 * @param {Array} classes
 */
function addDefaultSpacing(block, blockName, classes) {
  const isRebranding2023 = new URLSearchParams(window.location.search).get('test-variant') !== 'oldbrand';

  if (isRebranding2023) {
    const defaultSpacingBlocks = ['app-cards', 'app-cards-header', 'app-download', 'article-feed',
      'awards', 'callout', 'call-to-action', 'cards', 'carousel', 'center-page-cta', 'columns',
      'featured-articles', 'form', 'gallery', 'hero', 'image', 'logos', 'listing', 'listing-cards',
      'multi-cta-cards', 'multi-element', 'quote', 'resources-library', 'reviews', 'search',
      'tabs', 'title', 'wistia'];

    if (defaultSpacingBlocks.includes(blockName)) {
      const hasSpacing = classes.find(c => c.startsWith('spacing-') && !c.endsWith('-none'));

      if (!hasSpacing) {
        if (document.body.classList.contains('blog-post')
            || document.body.classList.contains('resources-guide')
            || (window.location.pathname.startsWith('/customers/')
                && window.location.pathname.length > 11)
            || window.location.pathname.startsWith('/legal/terms-of-service-faq/')
            || window.location.pathname.startsWith('/blog/author/')) {
          block.classList.add('spacing-sm');
        } else if (document.body.classList.contains('paid-landing-page')) {
          block.classList.add('spacing-lg');
        } else {
          block.classList.add('spacing-xl');
        }
      }
    }
  }
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const trimDashes = (str) => str.replace(/(^\s*-)|(-\s*$)/g, '');
  const classes = Array.from(block.classList.values());
  const blockName = classes[0];
  if (!blockName) return;
  const section = block.closest('.section');
  if (section) {
    section.classList.add(`${blockName}-container`.replace(/--/g, '-'));
  }
  const blockWithVariants = blockName.split('--');
  const shortBlockName = trimDashes(blockWithVariants.shift());
  const variants = blockWithVariants.map((v) => trimDashes(v));
  block.classList.add(shortBlockName);
  block.classList.add(...variants);

  block.classList.add('block');
  block.setAttribute('data-block-name', shortBlockName);
  block.setAttribute('data-block-status', 'initialized');

  addDefaultSpacing(block, blockName, classes);

  const blockWrapper = block.parentElement;
  blockWrapper.classList.add(`${shortBlockName}-wrapper`);
  const regex = /\b(?:tablet-|laptop-|desktop)?(?:content-)?width-(?:xxs|xs|sm|md|lg|xl|xxl|xxxl|full)\b/g;

  [...block.classList]
    .filter((filter) => filter.match(regex))
    .forEach((style) => {
      block.parentElement.classList.add(style);
      block.classList.remove(style);
    });
  // eslint-disable-next-line no-use-before-define
  addClassesToParent(block);
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope>div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else if (col.querySelector('picture')) {
          const imgEl = col.querySelector('picture');
          const imagePath = imgEl.firstElementChild.srcset;
          value = imagePath.substr(0, imagePath.indexOf('?'));
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

/**
 * Decorates backgrounds in sections.
 * @param {Element} $section The section element
 */
export function decorateBackgrounds($section) {
  const missingBgs = [
    'bg-bottom-cap-3-tint-laptop',
    'bg-bottom-cap-3-tint-mobile',
    'bg-bottom-cap-3-tint-tablet',
    'bg-top-cap-3-laptop',
    'bg-top-cap-3-mobile',
    'bg-top-cap-3-tablet',
    'bg-top-cap-4-laptop',
    'bg-top-cap-4-tablet',
    'bg-top-cap-4-mobile',
    'bg-top-cap-5-laptop',
    'bg-top-cap-5-tablet',
    'bg-top-cap-5-mobile',
    'bg-top-multi-7',
    'bg-bottom-multi-3',
    'bg-center-multi-3',
    'bg-block-center-page-cta',
    'bg-block-benefits-laptop',
    'bg-block-benefits-tablet',
    'bg-block-benefits-mobile',
    'bg-block-center-left-single-1-laptop',
    'bg-block-center-left-single-1-tablet',
    'bg-block-center-left-single-1-mobile',
    'bg-block-center-left-single-2-laptop',
    'bg-block-center-left-single-2-tablet',
    'bg-block-center-left-single-2-mobile',
    'bg-block-center-right-double-1-laptop',
    'bg-block-center-right-double-1-tablet',
    'bg-block-center-right-single-3-laptop',
    'bg-block-center-right-single-3-tablet',
    'bg-block-center-right-single-3-mobile',
    'bg-block-ee-solutions-quote-laptop',
    'bg-block-ee-solutions-quote-tablet',
    'bg-block-ee-solutions-quote-mobile',
    'bg-bottom-cap-1-laptop',
    'bg-bottom-cap-1-tablet',
    'bg-bottom-cap-1-mobile',
    'bg-bottom-cap-2-laptop',
    'bg-bottom-cap-2-tablet',
    'bg-bottom-cap-2-mobile',
    'bg-bottom-cap-3-laptop',
    'bg-bottom-cap-3-tablet',
    'bg-bottom-cap-3-mobile',
    'bg-bottom-cap-4-laptop',
    'bg-bottom-cap-4-tablet',
    'bg-bottom-cap-4-mobile',
    'bg-bottom-cap-5-laptop',
    'bg-bottom-cap-5-tablet',
    'bg-bottom-cap-5-mobile',
    'bg-bottom-cap-6-laptop',
    'bg-bottom-cap-6-tablet',
    'bg-bottom-cap-6-mobile',
    'bg-bottom-cap-7-laptop',
    'bg-bottom-cap-7-tablet',
    'bg-bottom-cap-7-mobile',
    'bg-cover-green-patterns-laptop',
    'bg-cover-green-patterns-tablet',
    'bg-cover-green-patterns-mobile',
    'bg-left-single-1-laptop',
    'bg-left-single-1-tablet',
    'bg-left-single-1-mobile',
    'bg-left-single-2-tablet',
    'bg-left-single-2-mobile',
    'bg-right-multi-2-mobile',
    'bg-top-cap-1-laptop',
    'bg-top-cap-1-tablet',
    'bg-top-cap-1-mobile',
    'bg-top-cap-2-laptop',
    'bg-top-cap-2-tablet',
    'bg-top-cap-2-mobile',
    'bg-top-multi-7-tint-10',
    'bg-top-multi-7-tint-15',
    'bg-top-multi-11-laptop',
    'bg-top-multi-11-tablet',
    'bg-top-multi-11-mobile',
    'bg-block-center-right-single-4-mobile',
    'bg-block-center-right-single-4-tablet',
    'bg-block-center-right-single-4-laptop',
    'bg-block-center-left-single-3-mobile',
    'bg-block-center-left-single-3-tablet',
    'bg-block-center-left-single-3-laptop',
    'bg-right-multi-4-mobile',
    'bg-right-multi-4-tablet',
    'bg-right-multi-4-laptop',
    'bg-right-multi-6-mobile',
    'bg-simple',
    'bg-simple-mobile',
    'bg-simple-tablet',
    'bg-simple-laptop',
    'bg-bottom-cap-8-mobile',
    'bg-bottom-cap-8-tablet',
    'bg-bottom-cap-8-laptop',
    'bg-bottom-cap-9-mobile',
    'bg-bottom-cap-9-tablet',
    'bg-bottom-cap-9-laptop',
    'bg-bottom-leaf-1-cityscape-mobile-mobile',
    'bg-bottom-leaf-1-cityscape-mobile-tablet',
    'bg-bottom-leaf-1-cityscape-mobile-laptop',
    'bg-bottom-leaf-1-cityscape-desktop-mobile',
    'bg-bottom-leaf-1-cityscape-desktop-tablet',
    'bg-bottom-leaf-1-cityscape-desktop-laptop',
  ];
  const sectionKey = [...$section.parentElement.children].indexOf($section);
  [...$section.classList]
    .filter((filter) => filter.match(/^bg-/g))
    .forEach((style, bgKey) => {
      const background = document.createElement('span');
      const fetchBase = window.hlx.serverPath;
      let sizes = [''];
      if (!style.startsWith('bg-leaf')) sizes = ['', 'laptop', 'tablet', 'mobile'];

      background.classList.add('bg', style);

      if (!style.startsWith('bg-gradient') && !style.startsWith('bg-solid') && !/bg-.*-multi/.test(style)) {
        // get svgs
        sizes.forEach((size, sizeKey) => {
          let name = style;

          if (size) name += `-${size}`;

          if (!missingBgs.includes(name)) {
            fetch(`${fetchBase}${window.hlx.codeBasePath}/styles/backgrounds/${name}.svg`).then(
              (resp) => {
                // skip if not success
                if (resp.status !== 200) return;

                // put the svg in the span
                resp.text().then((output) => {
                  const element = document.createElement('div');
                  let html = output;

                  // get IDs
                  const matches = html.matchAll(/id="([^"]+)"/g);
                  // replace IDs
                  [...matches].forEach(([, match], matchKey) => {
                    html = html.replaceAll(
                      match,
                      `${match}-id-${sectionKey}-${bgKey}-${sizeKey}-${matchKey}`
                    );
                  });

                  element.innerHTML = html;
                  const svg = element.firstChild;

                  svg.classList.add(size || 'desktop');

                  background.append(svg);
                  $section.classList.add('has-bg');
                });
              }
            );
          }
        });
      }
      if (style.startsWith('bg-gradient') || style.startsWith('bg-solid')) {
        $section.classList.add('has-bg');
      }
      $section.prepend(background);
    });
}

/**
 * Decorates all sections in a container element.
 * @param {Element} $main The container element
 */
export function decorateSections($main) {
  $main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.setAttribute('data-section-status', 'initialized');

    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      const keys = Object.keys(meta);
      keys.forEach((key) => {
        if (key === 'style') {
          section.classList.add(...meta.style.split(', ').map(toClassName));
        } else if (key === 'anchor') {
          section.id = toClassName(meta.anchor);
        } else if (key === 'bg-image') {
          const bgImg = meta['bg-image'];
          section.setAttribute('data-bg-image', bgImg);
          // eslint-disable-next-line no-use-before-define
          const bgPicture = createOptimizedPicture(bgImg, 'Background Image', false, [
            { media: '(min-width: 1025px)', width: '2000' },
            { media: '(min-width: 600px)', width: '1200' },
          ]);
          bgPicture.classList.add('bg', 'bg-image');
          if (!section.classList.contains('has-bg')) section.classList.add('has-bg');
          section.prepend(bgPicture);
        } else {
          section.dataset[toCamelCase(key)] = meta[key];
        }
      });
      decorateBackgrounds(section);
      sectionMeta.remove();
    }
  });
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
export function updateSectionsStatus(main) {
  const sections = [...main.querySelectorAll(':scope > div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.getAttribute('data-section-status');
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector(
        '.block[data-block-status="initialized"], .block[data-block-status="loading"]'
      );
      if (loadingBlock) {
        section.setAttribute('data-section-status', 'loading');
        break;
      } else {
        section.setAttribute('data-section-status', 'loaded');
        const event = new CustomEvent('section-display', { detail: { section } });
        document.body.dispatchEvent(event);
        /* eslint-disable no-console */
        console.log('event dispatched');
      }
    }
  }
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
export function decorateBlocks(main) {
  main
    .querySelectorAll('div.section div[class]:not(.default-content-wrapper)')
    .forEach((block) => decorateBlock(block));
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col?.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return blockEl;
}

/**
 * Gets the configuration for the given block, and also passes
 * the config through all custom patching helpers added to the project.
 *
 * @param {Element} block The block element
 * @returns {Object} The block config (blockName, cssPath and jsPath)
 */
function getBlockConfig(block) {
  const { blockName } = block.dataset;
  const cssPath = `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`;
  const jsPath = `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`;
  const original = { blockName, cssPath, jsPath };
  return window.hlx.patchBlockConfig
    .filter((fn) => typeof fn === 'function')
    .reduce(
      (config, fn) => fn(config, original),
      { blockName, cssPath, jsPath },
    );
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block, eager = false) {
  if (window.location.hostname !== 'localhost' && !window.location.hostname.endsWith('.page') && !matchAudience(block)) block.remove();
  else if (
    !(
      block.getAttribute('data-block-status') === 'loading' ||
      block.getAttribute('data-block-status') === 'loaded'
    )
  ) {
    block.setAttribute('data-block-status', 'loading');
    const { blockName, cssPath, jsPath } = getBlockConfig(block);
    try {
      const cssLoaded = new Promise((resolve) => {
        loadCSS(cssPath, resolve);
      });
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(jsPath);
            if (mod.default) {
              await mod.default(block, blockName, document, eager);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(`failed to load module for ${blockName}`, err);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, err);
    }
    block.setAttribute('data-block-status', 'loaded');
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
export async function loadBlocks(main) {
  updateSectionsStatus(main);
  const blocks = [...main.querySelectorAll('div.block')];
  for (let i = 0; i < blocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(blocks[i]);
    updateSectionsStatus(main);
  }
}

/**
 * Returns the true origin of the current page in the browser.
 * If the page is running in a iframe with srcdoc, the ancestor origin is returned.
 * @returns {String} The true origin
 */
export function getOrigin() {
  const { location } = window;
  return location.href === 'about:srcdoc' ? window.parent.location.origin : location.origin;
}

/**
 * Returns the true of the current page in the browser.mac
 * If the page is running in a iframe with srcdoc,
 * the ancestor origin + the path query param is returned.
 * @returns {String} The href of the current page or the href of the block running in the library
 */
export function getHref() {
  if (window.location.href !== 'about:srcdoc') return window.location.href;

  const { location: parentLocation } = window.parent;
  const urlParams = new URLSearchParams(parentLocation.search);
  return `${parentLocation.origin}${urlParams.get('path')}`;
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */
export function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]
) {
  const url = new URL(src, getHref());
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {[string]]} allowedHeadings The list of allowed headings (h1 ... h6)
 */
export function normalizeHeadings(el, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level} id="${tag.id}">${tag.textContent}</h${level}>`;
      }
    }
  });
}

function isNonDefaultColor(color) {
  const nonDefaultColors = ['red', 'orange', 'yellow', 'blue', 'purple', 'pink', 'teal'];

  return nonDefaultColors.includes(color.toLowerCase());
}

/**
 * Set template (page structure) and theme (page styles).
 */
function decorateTemplateAndTheme() {
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const isRebranding2023 = queryParams['test-variant'] !== 'oldbrand';
  if (isRebranding2023) {
    document.body.classList.add('rebranding2023');
  } else document.body.classList.add('old-brand');

  const template = getMetadata('template');
  if (template) document.body.classList.add(toClassName(template));
  const theme = getMetadata('theme');
  if (theme) {
    const themeValues = theme.split(',').map((t) => t.trim());
    themeValues.forEach((t) => {
      if (t.toLowerCase() === 'base') document.querySelector('main')?.setAttribute('id', 'base');
      if (isRebranding2023 && isNonDefaultColor(t)) document.body.classList.add('green');
      else document.body.classList.add(toClassName(t));
      // document.body.classList.add(toClassName(t));
    });
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * load LCP block and/or wait for LCP in default content.
 */
async function waitForLCP() {
  // eslint-disable-next-line no-use-before-define
  const lcpBlocks = LCP_BLOCKS;
  const block = document.querySelector('.block');
  const hasLCPBlock = block && lcpBlocks.includes(block.getAttribute('data-block-name'));
  if (hasLCPBlock) await loadBlock(block, true);

  document.querySelector('body').classList.add('appear');
  const lcpCandidate = document.querySelector('main img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', () => resolve());
      lcpCandidate.addEventListener('error', () => resolve());
    } else {
      resolve();
    }
  });
}

function initWebSDK(path, config) {
  
  if(!window.trackingQueue){
    window.trackingQueue = new AnalyticsQueue();    
  }
  
  // Preparing the alloy queue
  if (!window.alloy) {
    // eslint-disable-next-line no-underscore-dangle
    (window.__alloyNS ||= []).push('alloy');
    window.alloy = (...args) => new Promise((resolve, reject) => {
      window.setTimeout(() => {
        window.alloy.q.push([resolve, reject, args]);
      });
    });
    window.alloy.q = [];
  }

  // Loading and configuring the websdk
  return new Promise((resolve) => {
    import(path)
        .then(() => {
          if(!window.alloyConfigured){            
            window.alloy('configure', config).then(() => { window.alloyConfigured = true;});
          }
        })
        .then(resolve);
  });

}

function onDecoratedElement(fn) {
  // Apply propositions to all already decorated blocks/sections
  if (document.querySelector('[data-block-status="loaded"],[data-section-status="loaded"]')) {
    fn();
  }
  // Observe the DOM for changes
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.target.tagName === 'BODY'
        || m.target.dataset.sectionStatus === 'loaded'
        || m.target.dataset.blockStatus === 'loaded')) {
      fn();
    }
  });
  // Watch sections and blocks being decorated async
  observer.observe(document.querySelector('body'), {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-block-status', 'data-section-status'],
  });
  // Watch anything else added to the body
  observer.observe(document.querySelector('body'), { childList: true });  
}

function toCssSelector(selector) {
  return selector.replace(/(\.\S+)?:eq\((\d+)\)/g, (_, clss, i) => `:nth-child(${Number(i) + 1}${clss ? ` of ${clss})` : ''}`);
}
async function getElementForProposition(proposition) {
  const selector = proposition.data.prehidingSelector
      || toCssSelector(proposition.data.selector);
  return document.querySelector(selector);
}
async function getAndApplyRenderDecisions() {
  // Get the decisions, but don't render them automatically
  // so we can hook up into the AEM EDS page load sequence
  const response = await window.alloy('sendEvent', { renderDecisions: false });
  const { propositions } = response;

  onDecoratedElement(async () => {
    await window.alloy('applyPropositions', { propositions });    
    // filter propositions that have been rendered
    propositions.forEach((p) => {
      p.items = p.items.filter((i) => i.schema !== 'https://ns.adobe.com/personalization/dom-action' || !getElementForProposition(i));
    });
    // Changes should be applied now, so we can unhide
    const styleElement = document.getElementById('alloy-prehiding');
    if (styleElement) {
      styleElement.remove();
    }
  });

  // Reporting is deferred to avoid long tasks
  window.setTimeout(() => {
    // Report shown decisions
    window.alloy('sendEvent', {
      xdm: {
        eventType: 'decisioning.propositionDisplay',
        _experience: {
          decisioning: { propositions },
        },
      },
    });
  });
}

/**
 * Decorates the page.
 */
async function loadPage(doc) {
  
  // eslint-disable-next-line no-use-before-define
  await loadEager(doc);
  // eslint-disable-next-line no-use-before-define
  await loadLazy(doc);
  // eslint-disable-next-line no-use-before-define
  loadDelayed(doc);  
  // eslint-disable-next-line no-use-before-define
  analyticsTrackPageViews();  
  // eslint-disable-next-line no-use-before-define
  loadInitSideKick();
}

// Define an execution context for plugins
export const executionContext = {
  createOptimizedPicture,
  getAllMetadata,
  getMetadata,
  decorateBlock,
  decorateIcons,
  loadBlock,
  loadCSS,
  loadScript,
  sampleRUM,
  toCamelCase,
  toClassName,
};

export function initHlx(forceMultiple = false) {
  if (!window.hlx || forceMultiple) {
    window.hlx = window.hlx || {};
    window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
    window.hlx.codeBasePath = '';
    window.hlx.serverPath = '';
    window.hlx.patchBlockConfig = [];

    const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
    if (scriptEl) {
      try {
        [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  }
}

initHlx();

/*
 * ------------------------------------------------------------
 * Edit above at your own risk
 * ------------------------------------------------------------
 */

const LCP_BLOCKS = ['hero', 'featured-articles', 'columns']; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'bamboo-rum-conversion-1'; // add your RUM generation information here

sampleRUM('top');

window.addEventListener('unhandledrejection', (event) => {
  sampleRUM('error', { source: event.reason.sourceURL, target: event.reason.line });
});

window.addEventListener('error', (event) => {
  sampleRUM('error', { source: event.filename, target: event.lineno });
});

window.addEventListener('load', () => sampleRUM('load'));

let cwv = {};

// Forward the RUM CWV cached measurements to edge using WebSDK before the page unloads
window.addEventListener('beforeunload', () => {
  if (Object.keys(cwv).length > 0) {
    analyticsTrackCWV(cwv);
  }
});

// Callback to RUM CWV checkpoint in order to cache the measurements
sampleRUM.always.on('cwv', async (data) => {
  if (data.cwv) {
    cwv = {
      ...cwv,
      ...data.cwv,
    };
  }
});

await geoLookup();

if (!window.hlx.suppressLoadPage) loadPage(document);

/**
 * Converts a date string (YYYY-MM-DD) to a formatted string like 'June 4, 2024'.
 * Returns the original string if invalid or empty.
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string.
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Check for invalid date
  if (Number.isNaN(date)) return dateString;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function decorateButtons(block = document) {
  const noButtonBlocks = [];
  block.querySelectorAll(':scope a').forEach(($a) => {
    $a.title = $a.title || $a.textContent.trim();
    const $block = $a.closest('div.section > div > div');
    let blockName;
    if ($block) {
      blockName = $block.className;
    }
    if (!noButtonBlocks.includes(blockName) && $a.href !== $a.textContent) {
      const $up = $a.parentElement;
      const $twoup = $a.parentElement.parentElement;
      if (!$a.querySelector('img')) {
        if ($up.childNodes.length === 1 && ($up.tagName === 'P' || $up.tagName === 'DIV')) {
          $a.className = 'button accent'; // default
          $up.classList.add('button-container');
        }
        if (
          $up.childNodes.length === 1 &&
          $up.tagName === 'STRONG' &&
          $twoup.childNodes.length === 1 &&
          $twoup.tagName === 'P'
        ) {
          $a.className = 'button accent';
          $twoup.classList.add('button-container');
        }
        if (
          $up.childNodes.length === 1 &&
          $up.tagName === 'EM' &&
          $twoup.childNodes.length === 1 &&
          $twoup.tagName === 'P'
        ) {
          $a.className = 'button accent light';
          $twoup.classList.add('button-container');
        }
      }
    }
  });
}

export function toCategory(category) {
  let categoryName = toClassName(category);
  while (categoryName.includes('--')) categoryName = categoryName.replace('--', '-');
  return categoryName;
}

function setCategory() {
  let category = getMetadata('category');
  if (!category && window.location.pathname.includes('/category/')) {
    // eslint-disable-next-line prefer-destructuring
    category = window.location.pathname.split('/category/')[1];
  }

  const categoryName = toCategory(category);
  if (category) {
    document.body.classList.add(`category-${categoryName}`);
  }
}

/**
 * Build figcaption element
 * @param {Element} pEl The original element to be placed in figcaption.
 * @returns figCaptionEl Generated figcaption
 */

export function buildCaption(pEl) {
  const figCaptionEl = document.createElement('figcaption');
  pEl.classList.add('caption');
  figCaptionEl.append(pEl);
  return figCaptionEl;
}

/**
 * Build figure element
 * @param {Element} blockEl The original element to be placed in figure.
 * @returns figEl Generated figure
 */
export function buildFigure(blockEl) {
  const figEl = document.createElement('figure');
  figEl.classList.add('figure');
  // content is picture only, no caption or link
  if (blockEl?.firstElementChild) {
    if (
      blockEl.firstElementChild.nodeName === 'PICTURE' ||
      blockEl.firstElementChild.nodeName === 'VIDEO'
    ) {
      figEl.append(blockEl.firstElementChild);
    } else if (blockEl.firstElementChild.nodeName === 'P') {
      const pEls = Array.from(blockEl.children);
      pEls.forEach((pEl) => {
        if (pEl.firstElementChild) {
          if (
            pEl.firstElementChild.nodeName === 'PICTURE' ||
            pEl.firstElementChild.nodeName === 'VIDEO'
          ) {
            figEl.append(pEl.firstElementChild);
          } else if (pEl.firstElementChild.nodeName === 'EM') {
            const figCapEl = buildCaption(pEl);
            figEl.append(figCapEl);
          } else if (pEl.firstElementChild.nodeName === 'A') {
            const picEl = figEl.querySelector('picture');
            if (picEl) {
              pEl.firstElementChild.textContent = '';
              pEl.firstElementChild.append(picEl);
            }
            figEl.prepend(pEl.firstElementChild);
          }
        }
      });
      // catch link-only figures (like embed blocks);
    } else if (blockEl.firstElementChild.nodeName === 'A') {
      figEl.append(blockEl.firstElementChild);
    }
  }
  return figEl;
}

export async function readIndex(indexPath, collectionCache) {
  window.pageIndex = window.pageIndex || {};
  if (!window.pageIndex[collectionCache]) {
    let readPath = indexPath;
    let readInTheNews = false;
    if (indexPath.startsWith('/about-bamboohr/media-featured/query-index')) {
      readPath = '/about-bamboohr/press-release/query-index.json';
      readInTheNews = true;
    }

    const resp = await fetch(readPath);
    if (resp.status === 200) {
      const json = await resp.json();
      const lookup = {};
      json.data.forEach((row) => {
        lookup[row.path] = row;
      });
      let { data } = json;
      if (indexPath === '/webinars/query-index.json' || indexPath === '/webinars/query-index.json?sheet=default') {
        // Include/read live-demo-webinars when reading webinars index.
        const resp2 = await fetch('/live-demo-webinars/query-index.json?sheet=default');
        const json2 = await resp2.json();

        json2.data.forEach((row) => {
          lookup[row.path] = row;
        });

        data = [...json.data, ...json2.data];
      } else if (readInTheNews) {
        // Include/read lin-the-news when reading media-featured index.
        const resp2 = await fetch('/about-bamboohr/in-the-news/query-index.json');
        const json2 = await resp2.json();

        json2.data.forEach((row) => {
          lookup[row.path] = row;
        });

        data = [...json.data, ...json2.data];
      }
      window.pageIndex[collectionCache] = { data, lookup };
    } else {
      const lookup = {};
      const data = [];
      window.pageIndex[collectionCache] = { data, lookup };
    }
  }
}

/**
 * Get Webinar Registration Count
 * @param {String} pathToWebinar is the path to the webinar starting with /webinars/
 * @returns '{registered: value}' with value being either 'accepted' or a number string
 */
export async function getWebinarRegistrationCount(pathToWebinar) {
  const result = await fetch('https://www.bamboohr.com/xhr/webinars.php', {
    method: 'POST',
    body: JSON.stringify({webinarName: pathToWebinar})
  });
  return result.text();
}

/**
 * Increment Webinar Registration
 * @param {String} pathToWebinar is the path to the webinar starting with /webinars/
 */
export async function incrementWebinarRegistration(pathToWebinar) {
  await fetch('https://hook.us1.make.celonis.com/6fmmwewv1fq1lmuig782tnwde6mo1d9g', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({webinarName:pathToWebinar})
  });
}

const addDepartment = (departments, deptName, deptJobCount) => {
  const deptPath = deptName === 'Internships' ? '/careers/internships' : `/careers/${toCategory(deptName)}-team`;
  departments.push({department: deptName, deptJobCount, path: deptPath});
};

const getIsInternship = ((job) => job?.metadata?.some(m => m.name === 'Is this an internship?' && m.value));

const getJobListings = (jobs, subDeptName, data, departments) => {
  if (!jobs) return;

  jobs.forEach(job => {
    const collapsedDept = job.metadata.find(metaDept => metaDept.name === 'Careers Page Categorization');
    const existingDept = departments.find(d => d.department === collapsedDept.value);
    if (existingDept) existingDept.deptJobCount += 1;
    else addDepartment(departments, collapsedDept.value, 1);

    const isInternship = getIsInternship(job);
    if (isInternship) {
      const internshipDept = 'Internships';
      const existingInternshipDept = departments.find(d => d.department === internshipDept);
      if (existingInternshipDept) existingInternshipDept.deptJobCount += 1;
      else addDepartment(departments, internshipDept, 1);
    }

    const jobListingId = job.absolute_url.match(/\d+$/)[0];
    const jobListingURL = `/careers/application?gh_jid=${jobListingId}`;
    const loc = job.location.name.split('|');
    const jobLocState = loc[0] ? loc[0].trim() : '';
    const jobLocRemote = loc[1] ? loc[1].trim() : '';

    data.push({path: jobListingURL, department: collapsedDept.value, jobTitle: job.title,
      jobLocation: job.location.name, jobLocState, jobLocRemote, isInternship});
  });
};

const initDepartments = (departments) => {
  const deptNames = ['Business Operations', 'Customer Experience & Support', 'Engineering & IT', 'Finance & Legal', 'Human Resources', 'Internships', 'Marketing', 'Product', 'Sales'];

  deptNames.forEach(deptName => addDepartment(departments, deptName, 0));
}

const cacheJobListingsData = (collectionCache, json) => {
  const data = [];
  const lookup = {};
  const departments = [];

  initDepartments(departments);

  Object.values(json).forEach(dept => {
    Object.keys(dept.subDepartments).forEach(subDeptName => {
      const { subDepartments, jobs } = dept.subDepartments[subDeptName];

      if (subDepartments) {
        Object.values(subDepartments).forEach(subDeptLevel2 => {
          getJobListings(subDeptLevel2.jobs, subDeptName, data, departments);
        });
      } else getJobListings(jobs, subDeptName, data, departments);
    });
  });

  window.pageIndex[collectionCache] = { data, lookup, departments };
};

export async function readJobListings(collectionCache) {
  window.pageIndex = window.pageIndex || {};
  if (!window.pageIndex[collectionCache]) {

    // Live:
    const resp = await fetch('/xhr/careers.php');
    // Stage: const resp = await fetch('https://www.bamboostage.com/xhr/careers.php');
    // Local: const resp = await fetch('https://www.bamboolocal.com/xhr/careers.php');
    if (resp.status === 200) {
      const json = await resp.json();
      cacheJobListingsData(collectionCache, json);
    } else {
      const data = [];
      const lookup = {};
      const departments = [];
      window.pageIndex[collectionCache] = { data, lookup, departments };
    }
  }
}

export async function lookupPages(pathnames, collection, sheet = '') {
  const indexPaths = {
    blog: '/blog/fixtures/blog-query-index.json',
    integrations: '/integrations/query-index.json?sheet=listings',
    hrGlossary: '/resources/hr-glossary/query-index.json',
    hrSoftware: '/hr-software/query-index.json',
    hrvs: '/resources/events/hr-virtual/2022/query-index.json',
    liveDemoWebinars: '/live-demo-webinars/query-index.json?sheet=default',
    blockInventory: '/blocks/query-index.json',
    blockTracker: `/website-marketing-resources/block-inventory-tracker2.json?sheet=${sheet}`,
    resources: `/resources/query-index.json?sheet=resources`,
    speakers: `/speakers/query-index.json`,
    productUpdates: '/product-updates/query-index.json',
    webinars: '/webinars/query-index.json?sheet=default',
    jobDescription: '/job-description/query-index.json?sheet=default',
    listingCategory: '/integrations/query-index.json?sheet=listing-category'
  };
  const indexPath = indexPaths[collection];
  const collectionCache = `${collection}${sheet}`;
  await readIndex(indexPath, collectionCache);

  /* guard for legacy URLs */
  pathnames.forEach((path, i) => {
    if (path.endsWith('/')) pathnames[i] = path.substr(0, path.length - 1);
  });
  const { lookup } = window.pageIndex[collectionCache];
  const result = pathnames.map((path) => lookup[path]).filter((e) => e);
  return result;
}

export async function loadHeader(header) {
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const headerblockName = queryParams.header === 'meganav' ? 'meganav' : 'header';

  const headerBlock = buildBlock(headerblockName, '');
  header.append(headerBlock);
  decorateBlock(headerBlock);
  await loadBlock(headerBlock);
  // Patch logo URL for is-customer audience
  if (getBhrFeaturesCookie()) {
	const usp = new URLSearchParams(window.location.search);
    if (AUDIENCES['is-customer']() && !usp.has('audience')) {
      usp.append('audience', 'default');
      document.querySelector('.nav-brand a').href += `?${usp.toString()}`;
    }
  }
}

function loadFooter(footer) {
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const footerBlockName = queryParams.header ? 'megafooter' : 'footer';

  const footerBlock = buildBlock(footerBlockName, '');
  if (footer) footer.append(footerBlock);
  decorateBlock(footerBlock);
  loadBlock(footerBlock);
}

function buildPageHeader(main, type) {
  const section = document.createElement('div');
  let content = [];
  if (type === 'resources-guides') {
    const picture = document.querySelector('h1 + h5 + p > picture');
    const h1 = document.querySelector('h1');
    const h5 = h1.nextElementSibling?.tagName === 'H5' ? h1.nextElementSibling : null;
    content = [[picture], [h1], [h5]].filter((e) => e[0]);
  }
  const header = buildBlock('page-header', content);
  header.setAttribute('data-header-location', toClassName(type));
  section.append(header);
  main.prepend(section);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
async function buildAutoBlocks(main) {
  try {
    let template = toClassName(getMetadata('template'));
    if (window.location.pathname.startsWith('/blog/') && !template) template = 'blog';

    const templates = [
      'blog',
      'integrations-listing',
      'content-library',
      'webinar',
      'product-updates',
      'live-demo-webinar-lp',
      'press-release',
      'awards',
      'in-the-news',
      'hr-glossary',
      'hrvs-session',
      'plan-migration-page',
    ];
    if (templates.includes(template)) {
      const mod = await import(`./${template}.js`);
      if (mod.default) {
        await mod.default(main);
      }
    }

    if (
      template === 'resources-guides' ||
      template === 'performance-reviews'
    ) {
      buildPageHeader(main, template);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function linkImages(main) {
  main.querySelectorAll(':scope > div > p > picture').forEach((picture) => {
    const p = picture.parentElement;
    const a = p.querySelector('a');
    if (a && a.textContent.includes('://')) {
      a.textContent = '';
      a.append(picture);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export async function decorateMain(main) {
  linkImages(main);

  await buildAutoBlocks(main);
  setCategory();
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);

  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  window.setTimeout(() => sampleRUM.observe(main.querySelectorAll('picture > img')), 1000);
}

/**
 * Returns the label used for tracking link clicks
 * @param {Element} element link element
 * @returns link label used for tracking converstion
 */
function getLinkLabel(element) {
  return element.title ? toClassName(element.title) : toClassName(element.textContent);
}

function findConversionValue(parent, fieldName) {
  // Try to find the element by Id or Name
  const valueElement =
    document.getElementById(fieldName) || parent.querySelector(`[name='${fieldName}']`);
  if (valueElement) {
    return valueElement.value;
  }
  // Find the element by the inner text of the label
  return Array.from(parent.getElementsByTagName('label'))
    .filter((l) => l.innerText.trim().toLowerCase() === fieldName.toLowerCase())
    .map((label) => document.getElementById(label.htmlFor))
    .filter((field) => !!field)
    .map((field) => field.value)
    .pop();
}

/**
 * Registers conversion listeners according to the metadata configured in the document.
 * @param {Element} parent element where to find potential event conversion sources
 * @param {string} path fragment path when the parent element is coming from a fragment
 * @param {Element} ctaElement element used as CTA for conversion
 */
export async function initConversionTracking(parent, path, ctaElement) {
  const conversionElements = {
    form: () => {
      // Track all forms
      parent.querySelectorAll('form').forEach((element) => {
        const section = element.closest('div.section');
        if (section && section.dataset.conversionValueField) {
          const cvField = section.dataset.conversionValueField.trim();
          // this will track the value of the element with the id specified in the "Conversion Element" field.
          // ideally, this should not be an ID, but the case-insensitive name label of the element.
          sampleRUM.convert(
            undefined,
            (cvParent) => findConversionValue(cvParent, cvField),
            element,
            ['submit']
          );
        }
        const formConversionName =
          element.dataset.conversionName ||
          (section ? section.dataset.conversionName : '') ||
          (ctaElement ? getMetadata(`conversion-name--${getLinkLabel(ctaElement)}-`) : '') ||
          getMetadata('conversion-name');

        if (formConversionName) {
          sampleRUM.convert(formConversionName, undefined, element, ['submit']);
        } else {
          // if no conversion name is specified, use the form path or id
          sampleRUM.convert(path ? toClassName(path) : element.id, undefined, element, ['submit']);
        }
      });
    },
    link: () => {
      // track all links
      Array.from(parent.querySelectorAll('a[href]'))
        .map((element) => ({
          element,
          cevent:
            getMetadata(`conversion-name--${getLinkLabel(element)}-`) ||
            getMetadata('conversion-name') ||
            getLinkLabel(element),
        }))
        .forEach(({ element, cevent }) => {
          sampleRUM.convert(cevent, undefined, element, ['click']);
        });
    },
    'labeled-link': () => {
      // track only the links configured in the metadata
      const linkLabels = getMetadata('conversion-link-labels') || '';
      const trackedLabels = linkLabels
        .split(',')
        .map((p) => p.trim())
        .map(toClassName);

      Array.from(parent.querySelectorAll('a[href]'))
        .filter((element) => trackedLabels.includes(getLinkLabel(element)))
        .map((element) => ({
          element,
          cevent:
            getMetadata(`conversion-name--${getLinkLabel(element)}-`) ||
            getMetadata('conversion-name') ||
            getLinkLabel(element),
        }))
        .forEach(({ element, cevent }) => {
          sampleRUM.convert(cevent, undefined, element, ['click']);
        });
    },
  };

  const declaredConversionElements = getMetadata('conversion-element')
    ? getMetadata('conversion-element')
        .split(',')
        .map((ce) => toClassName(ce.trim()))
    : [];

  Object.keys(conversionElements)
    .filter((ce) => declaredConversionElements.includes(ce))
    .forEach((cefn) => conversionElements[cefn]());
}
/**
 * Repurposed `loadMartech()` function to load Adobe Target's prehiding script.
 * This is gated through a  metadata field called 'target' and it must equal 'on' for this to get called.
 */
async function initPrehiding() {

  /* Adobe Target Prehiding Snippet */
  // eslint-disable-next-line
  ;(function (win, doc, style, timeout) {
    const STYLE_ID = 'alloy-prehiding';

    function getParent() {
      return doc.head;
    }

    function addStyle(parent, id, def) {
      if (parent) {
        const styleElement = doc.createElement('style');
        styleElement.id = id;
        styleElement.innerText = def;
        parent.appendChild(styleElement);
      }
    }

    function removeStyle(parent, id) {
      if (parent) {
        const styleElement = doc.getElementById(id);
        if (styleElement) {
          parent.removeChild(styleElement);
        }
      }
    }

    addStyle(getParent(), STYLE_ID, style);
    setTimeout(() => {
      removeStyle(getParent(), STYLE_ID);
    }, timeout);
  }(window, document, "header, main, div {opacity: 0 !important}", 3000));
}

// eslint-disable-next-line no-unused-vars
async function setCSP() {
  const resp = await fetch(`/scripts/csp.json`);
  const json = await resp.json();
  const directives = Object.keys(json);
  const policy = directives.map((directive) => `${directive} ${json[directive].join(' ')}`).join('; ');
  const meta = document.createElement('meta');
  meta.setAttribute('http-equiv', 'Content-Security-Policy');
  meta.setAttribute('content', policy);
  document.addEventListener('securitypolicyviolation', (e) => sampleRUM('csperror', { source: `${e.documentURI}:${e.lineNumber}:${e.columnNumber}`, target: e.blockedURI }));
  document.head.appendChild(meta);
}

const pluginContext = {
  buildBlock,
  getAllMetadata,
  getMetadata,
  loadCSS,
  loadScript,
  sampleRUM,
  toCamelCase,
  toClassName,
};

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(doc) {

  const alloyLoadedPromise = initWebSDK('./alloy.min.js', getAlloyConfiguration(document));
  alloyLoadedPromise.then(()=> {
    window.analyticsLoaded = true;
    window.trackingQueue.processQueue();
  });
  
  if(getMetadata('target') === 'on'){
    await initPrehiding();
    alloyLoadedPromise.then(() => getAndApplyRenderDecisions());
  }
  
  if (getMetadata('experiment')
    || getMetadata('experiment-control')
    || Object.keys(getAllMetadata('campaign')).length
    || Object.keys(getAllMetadata('audience')).length) {
    
    // eslint-disable-next-line import/no-relative-packages
    const { loadEager: runEager } = await import('../plugins/experience-decisioning/src/index.js');
    await runEager.call(pluginContext, { audiences: AUDIENCES });
    
    // Redirect to experiment-control when variants are accessed directly
    if(getMetadata('experiment-control')){
      const url = new URL(getMetadata('experiment-control'));
      if (window.location.pathname !== url.pathname) {        
        if(!sessionStorage.getItem('served-experiment')){
          window.location.replace(url.pathname + window.location.search);                 
        }else{
          sessionStorage.removeItem('served-experiment');
        }
      }
    }
  }
  
  decorateTemplateAndTheme();
  loadTemplateCSS();
  
  document.documentElement.lang = 'en';   // todo - figure out what this is used for 
  
  const main = doc.querySelector('main');
  
  if (main) {    
    
    await decorateMain(main);
     
    // todo - can this be refactored?
    if (window.innerWidth >= 900)
      loadCSS(`${window.hlx.codeBasePath}/styles/fonts/early-fonts.css`);
    if (sessionStorage.getItem('lazy-styles-loaded')) {
      loadCSS(`${window.hlx.codeBasePath}/styles/fonts/early-fonts.css`);
      loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
    }
    
    if(window.requestAnimationFrame){
      await new Promise((res) => {
        window.requestAnimationFrame(async () => {
          await waitForLCP(LCP_BLOCKS);
          res();
        });
      });      
    } else {
      await waitForLCP(LCP_BLOCKS);     
    }
  }
}

/**
 * Schema markup functions
 */
function createProductSchemaMarkup() {
  const pageTitle = document.querySelector('h1').textContent;
  const pageUrl = document.querySelector('link[rel="canonical"]').getAttribute('href');
  const socialImage = document.querySelector('meta[property="og:image"]').getAttribute('content');

  const quoteAuthorElement = document.querySelector('.product-schema p:last-of-type');
  let quoteAuthor = '';
  if (quoteAuthorElement) quoteAuthor = quoteAuthorElement.textContent;

  const quoteTextElement = document.querySelector('.product-schema div div p:first-of-type');
  let quoteText = '';
  if (quoteTextElement) quoteText = quoteTextElement.textContent.replace(/["]+/g, '');

  const pageDescription = document
    .querySelector('meta[property="og:description"]')
    .getAttribute('content');
  const quotePublishDate = document.lastModified;
  const productSchema = {
    '@context': 'http://schema.org/',
    '@type': 'Product',
    name: pageTitle,
    url: pageUrl,
    image: socialImage,
    description: pageDescription,
    brand: 'Bamboohr',
    aggregateRating: {
      '@type': 'aggregateRating',
      ratingValue: '4.3',
      reviewCount: '593',
    },
    review: [
      {
        '@type': 'Review',
        author: quoteAuthor,
        datePublished: quotePublishDate,
        reviewBody: quoteText,
      },
    ],
  };
  const $productSchema = document.createElement('script');
  $productSchema.innerHTML = JSON.stringify(productSchema, null, 2);
  $productSchema.setAttribute('type', 'application/ld+json');
  const $head = document.head;
  $head.append($productSchema);
}

function createVideoObjectSchemaMarkup() {
  const videoName = document.querySelector('h1').textContent;
  const wistiaThumb = getMetadata('wistia-video-thumbnail');
  const wistiaVideoId = getMetadata('wistia-video-id');
  const wistiaVideoUrl = `https://fast.wistia.net/embed/iframe/${wistiaVideoId}`;
  const videoDescription = document
    .querySelector('meta[property="og:description"]')
    .getAttribute('content');
  const videoUploadDate = document.lastModified;
  const videoObjectSchema = {
    '@context': 'http://schema.org/',
    '@type': 'VideoObject',
    name: videoName,
    thumbnailUrl: wistiaThumb,
    embedUrl: wistiaVideoUrl,
    uploadDate: videoUploadDate,
    description: videoDescription,
  };
  const $videoObjectSchema = document.createElement('script');
  $videoObjectSchema.innerHTML = JSON.stringify(videoObjectSchema, null, 2);
  $videoObjectSchema.setAttribute('type', 'application/ld+json');
  const $head = document.head;
  $head.append($videoObjectSchema);
}

function createOrgSchemaMarkup() {
  const orgPageSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "url": "https://www.bamboohr.com",
    "sameAs": [
      "https://www.facebook.com/bamboohr/", 
      "https://x.com/bamboohr/", 
      "https://www.instagram.com/bamboohr/",
      "https://www.linkedin.com/company/bamboohr/",
      "https://www.youtube.com/user/bamboohr/"
    ],
    "logo": "https://www.bamboohr.com/images/about/media-assets/bamboohr-logo-green.png",
    "name": "Bamboo HR",
    "telephone": "+1-866-387-9595",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "42 Future Way",
      "addressLocality": "Draper",
      "addressRegion": "UT",
      "postalCode": "84020",
      "addressCountry": "USA"
    },
  };
  
  const aggregateRating = getMetadata('aggregate-rating');
  const totalRatings = getMetadata('total-ratings');
  const highestRating = getMetadata('highest-rating');
  const lowestRating = getMetadata('lowest-rating');

  if(aggregateRating) {

    const aggregateRatingSchema = {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating
    }

    if(totalRatings) aggregateRatingSchema.reviewCount = totalRatings;
    if(highestRating) aggregateRatingSchema.bestRating = highestRating;
    if(lowestRating) aggregateRatingSchema.worstRating = lowestRating;

    orgPageSchema.aggregateRating = aggregateRatingSchema;
  }

  const $orgPageSchema = document.createElement('script');
  $orgPageSchema.innerHTML = JSON.stringify(orgPageSchema, null, 2);
  $orgPageSchema.setAttribute('type', 'application/ld+json');
  const $head = document.head;
  $head.append($orgPageSchema);
}

function createFaqPageSchemaMarkup() {
  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [],
  };
  document.querySelectorAll('.faq-page-schema .accordion').forEach((tab) => {
    const q = tab.querySelector('h2').textContent.trim();
    const a = tab
      .querySelector('.tabs-content')
      .textContent.replace(/(\n|\n|\r)/gm, '')
      .trim();
    if (q && a) {
      faqPageSchema.mainEntity.push({
        '@type': 'Question',
        name: q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: a,
        },
      });
    }
  });
  const $faqPageSchema = document.createElement('script');
  $faqPageSchema.innerHTML = JSON.stringify(faqPageSchema, null, 2);
  $faqPageSchema.setAttribute('type', 'application/ld+json');
  const $head = document.head;
  $head.append($faqPageSchema);
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  // eslint-disable-next-line no-use-before-define
  loadDelayedOnClick();

  const header = doc.querySelector('header');
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if (queryParams.header === 'meganav') header.classList.add('header-meganav');
  const main = doc.querySelector('main');
  decorateIcons(main);
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? main.querySelector(hash) : false;
  if (hash && element) element.scrollIntoView();

  /**
   * Calls the Schema markup functions
   */
  if (getMetadata('schema')) {
    const schemaVals = getMetadata('schema').split(',');
    schemaVals.forEach((val) => {
      switch (val.trim()) {
        case 'Organization':
          createOrgSchemaMarkup();
          break;
        case 'Product':
          createProductSchemaMarkup();
          break;
        case 'VideoObject':
          createVideoObjectSchemaMarkup();
          break;
        case 'FAQPage':
          createFaqPageSchemaMarkup();
          break;
        default:
          break;
      }
    });
  }

  const headerloaded = loadHeader(header);
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/fonts/early-fonts.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  if (!window.location.hostname.includes('localhost'))
    sessionStorage.setItem('lazy-styles-loaded', 'true');
  addFavIcon('https://www.bamboohr.com/favicon.ico');

  if (document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"]')
    || document.head.querySelector('[property^="campaign:"],[property^="audience:"]')
    || document.querySelector('.section[class*="experiment-"],.section[class*="audience-"],.section[class*="campaign-"]')
    || [...document.querySelectorAll('.section-metadata div')].some((d) => d.textContent.match(/Experiment|Campaign|Audience/i))
    && (window.location.hostname.endsWith('hlx.page') || window.location.hostname === ('localhost'))) {
    // eslint-disable-next-line import/no-relative-packages
    const { loadLazy: runLazy } = await import('../plugins/experimentation/src/index.js');
    await runLazy.call(pluginContext, { audiences: AUDIENCES });
  }

  sampleRUM('lazy');
  await headerloaded;
  initConversionTracking(document);
}

function loadDelayedOnClick() {
  // eslint-disable-next-line no-use-before-define
  document.body.addEventListener('click', handleLoadDelayed);
}

async function handleLoadDelayed() {
  if (!window.hlx.delayedJSLoaded) {
    window.hlx.delayedJSLoaded = true;
    // eslint-disable-next-line import/no-cycle
    import('./delayed.js').then((mod) => {
      window.setTimeout(() => mod.default(), 2000);
      document.body.removeEventListener('click', handleLoadDelayed);
    });
  }
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  const testPaths = [
    '/c0/'
  ];
  const isOnTestPath = testPaths.includes(window.location.pathname);

  if (!isOnTestPath) handleLoadDelayed(); // import without delay (for testing page performance)
  else if (!window.hlx.performance) window.setTimeout(() => handleLoadDelayed(), 4000);

  // load anything that can be postponed to the latest here
}

async function loadInitSideKick() {
  if (!window.hlx.sideKickLoaded) {
    window.hlx.sideKickLoaded = true;
    // eslint-disable-next-line import/no-cycle
    import('../milo-utils/utils.js').then((mod) => {
      mod.initSidekick();
    });
  }
}

export async function loadFragment(path) {
  const resp = await fetch(`${path}.plain.html`);
  const main = document.createElement('main');
  if (resp.ok) {
    main.innerHTML = await resp.text();
    await decorateMain(main);
    await loadBlocks(main);
    decorateIcons(main);
  }
  return main;
}

export function lockBody() {
  const bs = document.body.style;
  bs.position = 'fixed';
  bs.top = `-${window.scrollY}px`;
  bs.left = 0;
  bs.right = 0;
}

export function unlockBody() {
  const bs = document.body.style;
  const scrollY = bs.top;
  bs.position = '';
  bs.top = '';
  bs.left = '';
  bs.right = '';
  window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
}

// eslint-disable-next-line camelcase
export function newsletterSubscribe(email, UTM_Medium_Capture__c, UTM_Source_Capture__c, UTM_Campaign_Capture__c, UTM_Content_Capture__c, UTM_Term_Capture__c, UTM_Landing_Page_Capture__c, UTM_Conversion_Page_Capture__c) {
  const action = 'https://www.bamboohr.com/ajax/blog-newsletter-form.php';
  // eslint-disable-next-line camelcase
  const body = `email=${encodeURIComponent(email)}&UTM_Medium_Capture__c=${encodeURIComponent(UTM_Medium_Capture__c)}&UTM_Source_Capture__c=${encodeURIComponent(UTM_Source_Capture__c)}&UTM_Campaign_Capture__c=${encodeURIComponent(UTM_Campaign_Capture__c)}&UTM_Content_Capture__c=${encodeURIComponent(UTM_Content_Capture__c)}&UTM_Term_Capture__c=${encodeURIComponent(UTM_Term_Capture__c)}&UTM_Landing_Page_Capture__c=${encodeURIComponent(UTM_Landing_Page_Capture__c)}&UTM_Conversion_Page_Capture__c=${encodeURIComponent(UTM_Conversion_Page_Capture__c)}`;
  fetch(action, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  });
}

/**
* Stores UTM parameters in sessionStorage if they are not already set
*/
const setUtmsInSession = () => {
  const searchString = window.location.search;
  const urlParams = new URLSearchParams(searchString);
  const utmFields = {
    utm_source: urlParams.get("utm_source"),
    utm_medium: urlParams.get("utm_medium"),
    utm_campaign: urlParams.get("utm_campaign"),
    utm_content: urlParams.get("utm_content"),
    utm_term: urlParams.get("utm_term"),
    gclid: urlParams.get("gclid"),
    msclkid: urlParams.get("msclkid"),
    landing_page: `${window.location.origin}${window.location.pathname}`,
    referrer: document.referrer,
    bhr_pvid: urlParams.get("bhr_pvid"),
    bhr_team: urlParams.get("bhr_team"),
    uid: urlParams.get("uid"),
    cid: urlParams.get("cid"),
    full_query_string: searchString.startsWith('?') ? searchString.substring(1) : searchString
  };

  Object.entries(utmFields).forEach(([key, value]) => {
      if (!sessionStorage.getItem(key) && value) {
          sessionStorage.setItem(key, value);
      }
  });
};

setUtmsInSession();

export function addUtmParametersFromSessionStorage() {
  const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
  const inputNames = {
	"UTM_Source_Capture__c": sessionStorage.getItem("utm_source"),
	"UTM_Medium_Capture__c": sessionStorage.getItem("utm_medium"),
	"UTM_Campaign_Capture__c": sessionStorage.getItem("utm_campaign"),
	"UTM_Content_Capture__c": sessionStorage.getItem("utm_content"),
	"UTM_Term_Capture__c": sessionStorage.getItem("utm_term"),
	"GCLID__c": sessionStorage.getItem("gclid"),
	"Microsoft_Click_ID__c": sessionStorage.getItem("msclkid"),
	"UTM_Landing_Page_Capture__c": sessionStorage.getItem("landing_page"),
	"sessionReferrerCapture": sessionStorage.getItem("referrer"),
	"UTM_Partner_Vendor_Capture__c": sessionStorage.getItem("bhr_pvid"),
	"UTM_Team_Capture__c": sessionStorage.getItem("bhr_team"),
	"Learning_Labs_UserID__c": sessionStorage.getItem("uid"),
	"companyIDformfill": sessionStorage.getItem("cid"),
	"Full_Query_String_Capture__c": sessionStorage.getItem("full_query_string")
  }

  hiddenInputs.forEach((input) => {
    const { name } = input;
    // eslint-disable-next-line no-prototype-builtins
    if (name in inputNames && (!input.value || input.value === 'null')) {
      input.value = inputNames[name];
    }
  });
}

/**
 * Sets the UTM_Conversion_Page_Capture__c hidden input field to the page URL user filled out the form on.
 */
export function setUtmConversionPage() {
  const conversionInput = document.querySelector('input[name="UTM_Conversion_Page_Capture__c"]');
  if (conversionInput) conversionInput.value = `${window.location.origin}${window.location.pathname}`;
}

export function insertNewsletterForm(elem, submitCallback) {
  const action = 'https://www.bamboohr.com/ajax/blog-newsletter-form.php';
  const relative = new URL(action).pathname;
  elem.querySelectorAll(`a[href="${action}"], a[href="${relative}"]`).forEach((a) => {
    const formDiv = document.createElement('div');
    formDiv.innerHTML = `
    <form class="nav-form" __bizdiag="96619420" __biza="WJ__">
      <input type="email" name="email" placeholder="Email Address" aria-label="email" autocomplete="off">
      <input type="hidden" name="UTM_Medium_Capture__c" value="">
      <input type="hidden" name="UTM_Source_Capture__c" value="">
      <input type="hidden" name="UTM_Campaign_Capture__c" value="">
      <input type="hidden" name="UTM_Content_Capture__c" value="">
      <input type="hidden" name="UTM_Term_Capture__c" value="">
      <input type="hidden" name="UTM_Landing_Page_Capture__c" value="">
      <input type="hidden" name="UTM_Conversion_Page_Capture__c" value="">
      <button class="">${a.textContent}</button>
    </form>
    `;
    const button = formDiv.querySelector('button');
    const input = formDiv.querySelector('input');
    button.addEventListener('click', (e) => {
      // eslint-disable-next-line camelcase
      const UTM_Medium_Capture__c = formDiv.querySelector('input[name="UTM_Medium_Capture__c"]').value;
      // eslint-disable-next-line camelcase
      const UTM_Source_Capture__c = formDiv.querySelector('input[name="UTM_Source_Capture__c"]').value;
      // eslint-disable-next-line camelcase
      const UTM_Campaign_Capture__c = formDiv.querySelector('input[name="UTM_Campaign_Capture__c"]').value;
      // eslint-disable-next-line camelcase
      const UTM_Content_Capture__c = formDiv.querySelector('input[name="UTM_Content_Capture__c"]').value;
      // eslint-disable-next-line camelcase
      const UTM_Term_Capture__c = formDiv.querySelector('input[name="UTM_Term_Capture__c"]').value;
      // eslint-disable-next-line camelcase
      const UTM_Landing_Page_Capture__c = formDiv.querySelector('input[name="UTM_Landing_Page_Capture__c"]').value;
      // eslint-disable-next-line camelcase
      const UTM_Conversion_Page_Capture__c = formDiv.querySelector('input[name="UTM_Conversion_Page_Capture__c"]').value;
      newsletterSubscribe(input.value, UTM_Medium_Capture__c, UTM_Source_Capture__c, UTM_Campaign_Capture__c, UTM_Content_Capture__c, UTM_Term_Capture__c, UTM_Landing_Page_Capture__c, UTM_Conversion_Page_Capture__c);
      e.preventDefault();
      submitCallback();
      input.value = '';
    });
    a.replaceWith(formDiv);
    addUtmParametersFromSessionStorage();
  });
}

/**
 * Return whether or not this element has a class that starts with the given string
 * @param {HtmlElement} elem
 * @param {string} classNameStart
 * @returns {boolean}
 */
export function hasClassStartsWith(elem, classNameStart) {
  const classNames = [...elem.classList];
  let isClassStartsWith = false;

  classNames.forEach((className) => {
    if (className.startsWith(classNameStart)) {
      isClassStartsWith = true;
    }
  });

  return isClassStartsWith;
}

/**
 * Gets array of parameterized values given a class that starts with a name
 * @param {string} className
 * @param {string} classNameStart
 * @return {string[]} Array of remaining items split on the hyphen (-)
 */
export function getValuesFromClassName(className, classNameStart) {
  const params = className.substring(classNameStart.length);

  return params.split('-');
}

/**
 * Creates an element with optional class and type
 * @param {string} elemType type of element to create
 * @param {...string} [cssClass] CSS class(es) to apply to element
 * @returns {Element}
 */
export function createElem(elemType, ...cssClass) {
  const elem = document.createElement(elemType);
  if (cssClass != null && cssClass.length) {
    elem.classList.add(...cssClass.join(' ').split(' '));
  }

  return elem;
}

/**
 * Add class to a block's parent.
 * @param {Element} block The block element
 * @param string parentClass The class to move from the block level to the parent level.
 */
export function addClassToParent(block, parentClass) {
  if (block.classList.contains(parentClass)) {
    block.parentElement.classList.add(parentClass);
    block.classList.remove(parentClass);
  }
}

/**
 * Add class to a block's parent.
 * @param {Element} block The block element
 */
function addClassesToParent(block) {
  const classes = [
    'full-width',
    'med-width',
    'normal-width',
    'small-width',
    'medium-width',
    'extra-wide',
    'extra-small-width',
    'top-section-top-margin',
    'bottom-margin',
    'top-margin',
    'laptop-small-width',
    'variable-width',
  ];
  classes.some((c) => {
    const found = block.classList.contains(c);
    if (found) {
      block.parentElement.classList.add(c);
      block.classList.remove(c);
    }
    return found;
  });
}

const params = new URLSearchParams(window.location.search);
if (params.get('performance')) {
  window.hlx.performance = true;
  import('./performance.js').then((mod) => {
    if (mod.default) mod.default();
  });
}

/**
 * Registers the 'convert' function to `sampleRUM` which sends
 * variant and convert events upon conversion.
 * The function will register a listener for an element if listenTo parameter is provided.
 * listenTo supports 'submit' and 'click'.
 * If listenTo is not provided, the information is used to track a conversion event.
 */
sampleRUM.drain('convert', (cevent, cvalueThunk, element, listenTo = []) => {
  async function trackConversion(celement) {
    const MAX_SESSION_LENGTH = 1000 * 60 * 60 * 24 * 30; // 30 days
    try {
      // get all stored experiments from local storage (unified-decisioning-experiments)
      const experiments = JSON.parse(localStorage.getItem('unified-decisioning-experiments'));
      if (experiments) {
        Object.entries(experiments)
          .map(([experiment, { treatment, date }]) => ({ experiment, treatment, date }))
          .filter(({ date }) => Date.now() - new Date(date) < MAX_SESSION_LENGTH)
          .forEach(({ experiment, treatment }) => {
            // send conversion event for each experiment that has been seen by this visitor
            sampleRUM('variant', { source: experiment, target: treatment });
          });
      }
      // send conversion event
      const cvalue = typeof cvalueThunk === 'function' ? await cvalueThunk(element) : cvalueThunk;
      sampleRUM('convert', { source: cevent, target: cvalue, element: celement });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('error reading experiments', e);
    }
  }

  function registerConversionListener(elements) {
    // if elements is an array or nodelist, register a conversion event for each element
    if (Array.isArray(elements) || elements instanceof NodeList) {
      elements.forEach((e) => registerConversionListener(e, listenTo, cevent, cvalueThunk));
    } else {
      listenTo.forEach((eventName) =>
        element.addEventListener(eventName, (e) => trackConversion(e.target))
      );
    }
  }

  if (element && listenTo.length) {
    registerConversionListener(element, listenTo, cevent, cvalueThunk);
  } else {
    trackConversion(element, cevent, cvalueThunk);
  }
});

// Declare conversionEvent, bufferTimeoutId and tempConversionEvent outside the convert function to persist them for buffering between
// subsequent convert calls
let bufferTimeoutId;
let conversionEvent;
let tempConversionEvent;

// call upon conversion events, sends them to alloy
sampleRUM.always.on('convert', async (data) => {
  const { element } = data;
  // eslint-disable-next-line no-undef
  if (element && alloy) {
    if (element.tagName === 'FORM') {
      conversionEvent = {
        event: 'Form Complete',
        ...(data.source ? { conversionName: data.source } : {}),
        ...(data.target ? { conversionValue: data.target } : {}),
      };

      if (
        conversionEvent.event === 'Form Complete' &&
        (data.target === undefined || data.source === undefined)
      ) {
        // If a buffer has already been set and tempConversionEvent exists, merge the two conversionEvent objects to send to alloy
        if (bufferTimeoutId !== undefined && tempConversionEvent !== undefined) {
          conversionEvent = { ...tempConversionEvent, ...conversionEvent };
        } else {
          // Temporarily hold the conversionEvent object until the timeout is complete
          tempConversionEvent = { ...conversionEvent };

          // If there is partial form conversion data, set the timeout buffer to wait for additional data
          bufferTimeoutId = setTimeout(async () => {
            await analyticsTrackFormSubmission(element, {
              conversion: {
                ...(conversionEvent.conversionName
                  ? { conversionName: `${conversionEvent.conversionName}` }
                  : {}),
                ...(conversionEvent.conversionValue
                  ? { conversionValue: `${conversionEvent.conversionValue}` }
                  : {}),
              },
            });
            tempConversionEvent = undefined;
            conversionEvent = undefined;
          }, 100);
        }
      }
    } else if (element.tagName === 'A') {
      conversionEvent = {
        event: 'Link Click',
        ...(data.source ? { conversionName: data.source } : {}),
        ...(data.target ? { conversionValue: data.target } : {}),
      };
      await analyticsTrackLinkClicks(element, 'other', {
        conversion: {
          ...(conversionEvent.conversionName
            ? { conversionName: `${conversionEvent.conversionName}` }
            : {}),
          ...(conversionEvent.conversionValue
            ? { conversionValue: `${conversionEvent.conversionValue}` }
            : {}),
        },
      });
      tempConversionEvent = undefined;
      conversionEvent = undefined;
    }
  }
});

/**
 * Converts a Google Sheets serial number to a date string (YYYY-MM-DD)
 * without any time zone adjustments.
 * This function ensures consistent date handling across all time zones.
 * 
 * @param {number} serialNumber - The Google Sheets serial number.
 * @returns {string} - The date in YYYY-MM-DD format.
 */
export function convertSerialNumberToDateNoTZ(serialNumber) {
  // Constants for Google Sheets date conversion
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
  // Create a Date object at UTC midnight for the Google Sheets epoch date
  const epochDate = new Date(Date.UTC(1899, 11, 30));
  
  // Calculate milliseconds and create a new UTC date
  const dateInMilliseconds = epochDate.getTime() + serialNumber * millisecondsPerDay;
  const utcDate = new Date(dateInMilliseconds);
  
  // Extract year, month, day from the UTC date
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  
  // Return formatted date string
  return `${year}-${month}-${day}`;
}

/**
 * Converts a Google Sheets time value (fraction of a day) from Mountain Time (MT)
 * to a specified target timezone.
 * 
 * @param {number} sheetValue - The time value from Google Sheets (e.g., 0.4166667 for 10:00 AM).
 * @param {string} targetTimezone - The IANA timezone identifier (e.g., "America/Los_Angeles").
 * @returns {string} - The converted time in HH:mm:ss format.
 */
export function convertMountainTimeTo(sheetValue, targetTimezone) {
  const totalSeconds = sheetValue * 24 * 60 * 60;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const currentDate = new Date();
  const baseDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), hours, minutes));

  const timeZone = "America/Denver";
  const timeZoneOffset = new Date(baseDate.toLocaleString("en-US", { timeZone })).getHours() - baseDate.getUTCHours();
  const timeZoneOffsetMinutes = timeZoneOffset * 60;

  const mtDate = new Date(baseDate.getTime() - timeZoneOffsetMinutes * 60 * 1000);

  const targetTime = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(mtDate);

  return targetTime;
}

export function toSlug(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

/**
 * Capitalize first letter of object keys
 * @param {object} obj - The object to capitalize keys for
 * @returns {object} The object with capitalized keys
 */
const capitalizeKeys = (obj) => {
  const modifiedObj = {};
  Object.keys(obj).forEach((key) => {
    let modifiedKey = key;
    if(!key.includes('emailPreferences')){
      modifiedKey = key.charAt(0).toUpperCase() + key.slice(1);
    }
    modifiedObj[modifiedKey] = obj[key];      
  });
  return modifiedObj;
};

function base64DecodeUnicode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

export function decodeFormFillDataFromURLifExists(paramName) {
  try {
    // eslint-disable-next-line no-shadow
    const params = new URLSearchParams(window.location.search);
    const base64String = params.get(paramName);
    if (base64String) {    
      const decodedString = base64DecodeUnicode(decodeURIComponent(base64String));  
      return JSON.parse(decodedString);
    }
  } catch (error) {
    console.error("Error decoding form fill data from query parameter:", error.message);    
    return null;
  }  
  return null;
}

/**
 * Get prefill fields from marketo cookie
 * @returns {Promise<object|null>} The prefill fields object or null if there was an error
 */
export const getPrefillFields = async (useMarketoCookie = false) => {
  const cookieName = 'bhr_prefill';
  const cookie = document.cookie.match(`(^|;)\\s*${cookieName}\\s*=\\s*([^;]+)`)?.pop();
  // eslint-disable-next-line no-shadow
  const params = new URLSearchParams(window.location.search);
  const marketoId = params.get('mid');

  if(cookie && !useMarketoCookie){
    try {
      const cookieValue = JSON.parse(atob(cookie));
      document.hasFormPrefillCookie = true;
      return cookieValue;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    }
  } else if (useMarketoCookie) {
    try {
      const formFillRequestData = new FormData();
      formFillRequestData.append('marketoCookie', readCookie('_mkto_trk'));
      const response = await fetch('/xhr/formfill.php', {
        method: 'POST',
        body: formFillRequestData
      });
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(`Prefill request failed with status: ${response.status}`);
        return null;
      }
      const data = await response.json();
      const {formData} = data;
      return (formData ? capitalizeKeys(formData) : null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    }
  } else if (marketoId) {
    // check passed in ID and use it to perform lead lookup
    try {
      const response = await fetch(`/xhr/formfill.php?mid=${marketoId}`);
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(`Prefill request failed with status: ${response.status}`);
        return null;
      }
      const data = await response.json();
      const {formData} = data;
      return (formData ? capitalizeKeys(formData) : null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    }
  }

  return null;
}

export const sha256hash = val =>
  crypto.subtle
    .digest('SHA-256', new TextEncoder('utf-8').encode(val))
    .then(h => {
      const hexes = [];
      const view = new DataView(h);
      for (let i = 0; i < view.byteLength; i += 4)
        // eslint-disable-next-line prefer-template
        hexes.push(('00000000' + view.getUint32(i).toString(16)).slice(-8));
      return hexes.join('');
    });

// eslint-disable-next-line default-param-last
export function setCookie(name, value, path = '/', expirationInSeconds) {
 
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (path) {
    cookieString += `; path=${path}`;
  }

  if (expirationInSeconds) {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + expirationInSeconds);
    cookieString += `; expires=${expirationDate.toUTCString()}`;
  }

  document.cookie = cookieString;
}


setupScrollTracking(analyticsTrackScrollDepth);

export const formatReadtime = (readtime) =>
  readtime !== '' ? `${parseInt(readtime, 10)} min` : '';
