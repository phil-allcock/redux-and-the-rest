import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import makeRequest from '../../action-creators/helpers/makeRequest';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import { ERROR, NEW, SUCCESS, UPDATING } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getActionCreatorNameFrom from '../../action-creators/helpers/getActionCreatorNameFrom';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * Redux action creator used for sending an UPDATE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} values The attribute values to use to update the resource
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Thunk}
 */
function actionCreator(options, params, values, actionCreatorOptions = {}) {
  const {
    action, transforms, url: urlTemplate, name, progress, keyBy, projection, requestAdaptor
  } = options;

  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(normalizedParams, keyBy));

  return (dispatch) => {
    dispatch(
      submitUpdateResource(
        { transforms, action, key, projection },
        actionCreatorOptions,
        values,
        actionCreatorOptions
      )
    );

    return makeRequest({
      ...options,

      previousValues: actionCreatorOptions.previous,
      url,
      key, keyBy,
      params: normalizedParams,
      dispatch,
      credentials: true,
      request: {
        method: 'PUT',
        body: JSON.stringify(requestAdaptor ? requestAdaptor(values) : values),
      },
      onSuccess: receiveUpdatedResource,
      onError: handleUpdateResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to  update a new resource item as being created on a remote API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions={} The options passed to the update* action creator function
 * @param {Object} values The attributes of the resource currently being created
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function submitUpdateResource(options, actionCreatorOptions, values) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: UPDATING, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: UPDATING }
    }),
    previousValues: actionCreatorOptions.previousValues
  };
}

/**
 * Redux action creator used for updating a resource locally (without making any requests to a RESTful API endpoint)
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} values The attribute values to use to update the resource
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, params, values, actionCreatorOptions = {}) {
  return receiveUpdatedResource(
    { ...options, params },
    actionCreatorOptions,
    values,
    actionCreatorOptions.previous
  );
}

/**
 * Creates an action object to update a resource item after it's been confirmed as updated on an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The values returned by the external API for the newly created resource item
 * @param {Object} previousValues The values the resource item previously had, which is used to more efficiently
 *        update any associated resource items or collections
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveUpdatedResource(options, actionCreatorOptions, values, previousValues) {
  const { transforms, action, params, keyBy, localOnly } = options;

  const normalizedParams = wrapInObject(params, keyBy);

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([values, normalizedParams], { keyBy }),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() }
    }),
    previousValues,
    localOnly
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when the request to
 * update it on the external API failed
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} error An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleUpdateResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR, key,
    httpCode,
    error
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it being updated
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, key, status, item, httpCode, error }) {
  const { items } = resources;

  assertInDevMode(() => {
    /**
     * We warn if the user is attempting to update a resource item that doesn't exist in the Redux store, or
     * if the user is attempting to update a resource that has not yet been saved to the external API
     */
    if (!items[key]) {
      const actionCreatorName = getActionCreatorNameFrom(type);

      warn(
        `${type}'s key '${key}' did not match any items in the store. Check the arguments passed to ` +
        `${actionCreatorName}(). (Update request still sent to the server.)`
      );
    } else if (items[key].status.type === NEW) {
      const actionCreatorName = getActionCreatorNameFrom(type, { replaceVerb: 'edit' });

      warn(
        `${type}'s key '${key}' matched a new resource. Use ${actionCreatorName}() to modify an item that has ` +
        'not been saved to the server yet. (Update request still sent to the server.)'
      );
    }
  });

  const currentItem = items[key] || ITEM;

  if (status === UPDATING) {
    /**
     * While updating (waiting for the update to be confirmed by an external API), we shallow merge the new
     * attribute values with the exist ones for the resource item
     */
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === SUCCESS) {
    /**
     * When the external API confirms the update has completed, we merge any attribute values returned by
     * the server into those already saved in the Redux store, and update the status to be SUCCESS
     */
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newStatus = {
      ...currentItem.status,
      ...item.status
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,
        status: newStatus
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === ERROR) {
    /**
     * If the request to update the resource item failed, we store the details of the error from the response
     * in the status of the resource item and leave the item's attributes as they were expected to be if the
     * update had succeeded.
     */
    const newItems = {
      ...items,
      [key]: {
        ...items[key],
        status: {
          type: status,
          httpCode,
          error
        }
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator,
  localActionCreator
};
