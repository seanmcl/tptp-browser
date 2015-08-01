'use strict';

import $ from 'jquery';
import Actions from './SiteActionCreators';

const logError = e => console.log(e);

export const CHANGE_EVENT = 'change';
export const PROBLEM_MAX_SIZE = '100000';

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 *
 */
export const dirname = s => s.replace(/\/[^\/]*\/?$/, '');


/**
 *
 */
export const basename = s => s.split(/[\\/]/).pop();


/**
 *
 */
export const hashString = str => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};


/**
 *
 */
const parseJsonOrJsonArray = s => {
  try {
    return JSON.parse(s);
  } catch (_) {
    try {
      const res = JSON.parse(`[${s.trim().replace(/\n/g, ',')}]`);
      return res
    } catch (_) {
      throw `Can't parse as JSON: ${s}`;
    }
  }
};

/**
 *
 */
const getJsonOrJsonArray = (url, success) => {
  const success1 = text =>
    success(parseJsonOrJsonArray(text));
  return $.ajax({dataType: 'text', url}).success(success1).error(logError);
};

/**
 *
 */
const getText = (url, success) => {
  return $.ajax({dataType: 'text', url, success}).error(logError);
};

/**
 *
 */
export const getProblemBrowserIndex = () =>
  getJsonOrJsonArray('/index.json', Actions.problemBrowserReceiveIndex);


/**
 *
 */
export const getProblemBrowserFile = filename =>
  getText(filename, Actions.problemBrowserReceiveFile(filename));


export default {
  dirname: dirname,
  basename: basename,
  hashString: hashString,
}
