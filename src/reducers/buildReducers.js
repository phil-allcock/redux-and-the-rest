import { RESOURCES } from '../constants/DataStructures';
import without from '../utils/collection/without';
import isObject from '../utils/object/isObject';
import warn from '../utils/dev/warn';
import arrayFrom from '../utils/array/arrayFrom';
import addAssociationReducer from './helpers/addAsssociationReducer';
import resolveOptions from '../action-creators/helpers/resolveOptions';
import progressReducer from './helpers/progressReducer';
import { getConfiguration } from '../configuration';
import standardiseAssociationOptions from '../utils/standardiseAssociationOptions';
import indexAction from '../actions/RESTful/index';
import showAction from '../actions/RESTful/show';
import newAction from '../actions/RESTful/new';
import clearNewAction from '../actions/RESTful/clearNew';
import editNewAction from '../actions/RESTful/editNew';
import createAction from '../actions/RESTful/create';
import editAction from '../actions/RESTful/edit';
import updateAction from '../actions/RESTful/update';
import destroyAction from '../actions/RESTful/destroy';
import selectAction from '../actions/selection/select';
import selectAnotherAction from '../actions/selection/selectAnother';
import deselectAction from '../actions/selection/deselect';
import clearSelectedAction from '../actions/selection/clearSelected';
import clearAction from '../actions/clear/clear';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';

/**
 * Dictionary of standard reducer functions for keeping the local store synchronised with a remote RESTful API.
 */
const STANDARD_REDUCERS = {
  /**
   * RESTful actions
   */
  index: indexAction.reducer,
  show: showAction.reducer,
  new: newAction.reducer,
  clearNew: clearNewAction.reducer,
  editNew: editNewAction.reducer,
  create: createAction.reducer,
  edit: editAction.reducer,
  update: updateAction.reducer,
  destroy: destroyAction.reducer,

  /**
   * Selection actions
   */
  clear: clearAction.reducer,
  select: selectAction.reducer,
  selectAnother: selectAnotherAction.reducer,
  deselect: deselectAction.reducer,
  clearSelected: clearSelectedAction.reducer
};

/**
 * Dictionary of RESTful actions that have progress events
 * @type {Object<string, boolean>}
 */
const PROGRESS_COMPATIBLE_ACTIONS = {
  index: true,
  show: true,
  update: true,
  create: true
};

function getProgressReducer(key) {
  if (key === 'index') {
    return (resources, action) => progressReducer(resources, action, 'collections');
  } else {
    return progressReducer;
  }
}

/**
 * Dictionary or reducer functions to use when the localOnly option is set, causing changes to be performed
 * synchronously, without any requests being made to an external API.
 */
const LOCAL_ONLY_REDUCERS = without(STANDARD_REDUCERS, Object.keys(RemoteOnlyActionsDictionary));

/**
 * Function that accepts the current state and Redux action and returns the correct new state.
 * @callback ReducerFunction
 * @param {ResourcesReduxState} currentState The current state of the part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */

/**
 * Creates the reducer function can be used to correctly update a resource's state after every Redux action that
 * is dispatched.
 * @param {ResourceOptions} resourceOptions Hash of actionsOptions for configuring the resource
 * @param {ActionsDictionary} actionsDictionary Dictionary of actions available for the resource
 * @param {ActionOptions} actionsOptions Hash of actionsOptions for configuring the actions that be dispatched to
 *        modify the resource
 * @returns {ReducerFunction} Reducer function that will accept the resource's current state and an action
 *          and return the new resource state
 */
function buildReducers(resourceOptions, actionsDictionary, actionsOptions) {

  /**
   * Build the map of actions that should effect the current resource
   */
  const configuration = getConfiguration();

  /**
   * We use a different set of reducers when the localOnly option is used (to perform updates synchronously
   * without making any requests to a remote API).
   */
  const effectiveReducers = resourceOptions.localOnly ? LOCAL_ONLY_REDUCERS : STANDARD_REDUCERS;

  /**
   * Iterate over the list of defined actions, creating the corresponding reducer and storing it in a map to
   * be retrieved and called each time the action occurs
   */
  const reducersDict = Object.keys(actionsOptions).reduce((memo, key) => {
    const actionOptions = actionsOptions[key];

    /**
     * Allow overriding the default reducer (or specifying a reducer for a custom action) otherwise default
     * to the standard reducer
     */
    const reducer = (isObject(actionOptions) && actionOptions.reducer) || effectiveReducers[key];

    if (!reducer) {

      if (resourceOptions.localOnly && STANDARD_REDUCERS[key]) {
        warn(`Action '${key}' is not compatible with the localOnly option.`);
      } else {
        const standardReducersList = Object.keys(STANDARD_REDUCERS).join(', ');

        warn(`Action '${key}' must match the collection of standard reducers (${standardReducersList}) or define a 'reducer' option.`);
      }
    } else {
      /**
       * Construct the correct reducer options, merging the those specified (in order of precedence):
       * - In the individual action definitions passed to the resource function ("Action options")
       * - Using the general options passed to the resources function ("Resource options"
       * - Using the configure function ("Global options")
       *
       * These options can still be overridden by options passed to the action creator each time it's called
       */
      const reducerOptions = resolveOptions(
        /**
         * List of objects to source options from
         */
        { beforeReducers: [], afterReducers: [], }, configuration, resourceOptions, actionOptions,
        /**
         * List of options to pluck
         */
        ['progress', 'beforeReducers', 'afterReducers',]
      );

      /**
       * Set up the additional transform functions required to process progress updates if the progress
       * actions have been enabled.
       */
      if (reducerOptions.progress && (!STANDARD_REDUCERS[key] || PROGRESS_COMPATIBLE_ACTIONS[key])) {
        reducerOptions.beforeReducers = [
          ...reducerOptions.beforeReducers,
          getProgressReducer(key)
        ];
      }

      const _reducer = function(){
        /**
         * If there are additional transform functions to be run before or after the primary reducer
         * enqueue them to run in sequence, passing the result of each to the next
         */
        if (reducerOptions.beforeReducers.length > 0 || reducerOptions.afterReducers.length > 0) {
          return (resources, action) => {
            let _resources = resources;

            reducerOptions.beforeReducers.forEach((beforeReducer) => {
              _resources = beforeReducer(_resources, action);
            });

            _resources = reducer(_resources, action);

            reducerOptions.afterReducers.forEach((afterReducer) => {
              _resources = afterReducer(_resources, action);
            });

            return _resources;
          };
        } else {
          return reducer;
        }
      }();

      memo[actionsDictionary.get(key)] = {
        options: reducerOptions,
        reducer: _reducer
      };
    }

    return memo;
  }, {});

  /**
   * Add actions for which the current resource should be cleared
   */
  arrayFrom(resourceOptions.clearOn).forEach((action) => {
    reducersDict[action] = { reducer: STANDARD_REDUCERS.clear };
  });

  /**
   * Add actions for which the current resource should call a reducer function
   */
  arrayFrom(resourceOptions.reducesOn).forEach(({ action, reducer }) => {
    reducersDict[action] = { reducer };
  });

  /**
   * Add actions that update this resources' foreign keys
   */
  if (resourceOptions.hasAndBelongsToMany) {
    Object.keys(resourceOptions.hasAndBelongsToMany).forEach((associationName) => {
      const associationOptions = standardiseAssociationOptions(
        resourceOptions.hasAndBelongsToMany[associationName]
      );

      addAssociationReducer(
        reducersDict,
        resourceOptions.name,
        'hasAndBelongsToMany',
        associationName,
        associationOptions
      );
    });
  }

  if (resourceOptions.belongsTo) {
    Object.keys(resourceOptions.belongsTo).forEach((associationName) => {
      const associationOptions = standardiseAssociationOptions(
        resourceOptions.belongsTo[associationName]
      );

      addAssociationReducer(
        reducersDict,
        resourceOptions.name,
        'belongsTo',
        associationName,
        associationOptions
      );
    });
  }

  return (resource = RESOURCES, action = {}) => {
    const { type } = action;

    const actionReducer = reducersDict[type];

    if (actionReducer) {
      return actionReducer.reducer(resource, action);
    } else {
      return resource;
    }
  };
}

export default buildReducers;
