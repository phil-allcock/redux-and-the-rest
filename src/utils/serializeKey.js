import isObject from './object/isObject';

/**
 * Serializes an object to create a consistent key, no matter the ordering of the attributes, suitable to use
 * as a key for resource items and collections.
 * @param {any} target The object to serialize
 * @returns {string} The serialized key
 */
function serializeKey(target) {
  if (isObject(target)) {
    const sortedKeys = Object.keys(target).sort();

    return sortedKeys.map((key) => `${key}=${target[key]}`).join('.');

  } else {
    return target || '';
  }
}

export default serializeKey;
