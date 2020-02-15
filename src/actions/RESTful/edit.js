import getItemKey from '../../action-creators/helpers/getItemKey';
import { EDITING } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for updating the attributes of a resource item WITHOUT sending those updated
 * attributes to a remote API (yet). This action is used for editing a resource item locally (perhaps across
 * multiple stages or screens) before actually updating it (which sends the new attributes to the remote API).
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} values The new attribute values to merge into the exist ones of the resource item.
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator(options, params, values, actionCreatorOptions = {}) {
  const { action, transforms, keyBy } = options;

  const key = getItemKey(params, { keyBy });

  return {
    type: action,
    status: EDITING,
    key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: EDITING }
    })
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it's edited (perhaps over multiple stages).
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, key, item }) {
  const { items } = resources;

  /**
   * We warn about editing a resource that doesn't actually exist in the redux store
   */
  assertInDevMode(() => {
    if (!items[key]) {
      warn(`${type}'s key '${key}' does not match any items in the store. Use a new*() to create a new item or check the arguments passed to edit*(). (A new item was created to contain the edit.)`);
    }
  });

  const currentItem = items[key] || ITEM;

  /**
   * We do a shallow merge of the values that already exist in the redux store for the resource item
   * with the new values being supplied as part of the edit.
   *
   * This allows for partial edits - without having to re-specify the entire list of previous attribute values
   */
  const newValues = {
    ...currentItem.values,
    ...item.values
  };

  return {
    ...resources,
    items: {
      ...items,
      [key]: {
        ...item,
        values: newValues,
      }
    }
  };
}

export default {
  reducer,
  actionCreator
};