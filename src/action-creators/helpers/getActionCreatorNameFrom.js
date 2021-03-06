import camelCase from '../../utils/string/camelCase';

function getActionCreatorNameFrom(actionName, options = {}) {
  if (options.verb) {
    const segments = actionName.split('_');
    segments[0] = options.replaceVerb;

    return camelCase(actionName.replace(options.verb, options.replaceVerb));
  } else if (options.replaceVerb) {
    const segments = actionName.split('_');
    segments[0] = options.replaceVerb;

    return camelCase(segments.join('_'));
  } else {
    return camelCase(actionName);
  }
}

export default getActionCreatorNameFrom;
