/**
 * The status used when a new resource item has not yet been saved to an external API
 */
export const NEW: string;

/**
 * The status used when a resource item is being edited
 */
export const EDITING: string;

/**
 * The status used when a resource item or collection is being synchronised with an external API
 */
export const FETCHING: string;

/**
 * The status used when a new resource item is being saved to an external API for the first time
 */
export const CREATING: string;

/**
 * The status used when an edited resource item is being saved to an external API
 */
export const UPDATING: string;

/**
 * The status used when a resource item is being deleted on an external API
 */
export const DESTROYING: string;

/**
 * The status used when a resource item failed to be deleted from an external API
 */
export const DESTROY_ERROR: string;

/**
 * The status used when a resource item or collection has been successfully synchronised with an external API
 */
export const SUCCESS: string;

/**
 * The status used when a resource item or collection has is being uploaded or downloaded from an external API
 */
export const PROGRESS: string;

/**
 * The status used when a resource item or collection failed to synchronise with an external API
 */
export const ERROR: string;

/**
 * The projection type used when all of the attributes of of a resource are included
 */
export const COMPLETE: string;

/**
 * The projection type used when only the attributes necessary for a preview are included
 */
export const PREVIEW: string;

/**
 * One of the statuses a resource item or resource collection can be in
 */
export type StatusType = string;

/**
 * An object containing the status information of a particular resource item or resource collection.
 */
export interface ResourceStatus {
    type: StatusType | null;
}

/**
 * The state and values of a single item of a particular resource
 */
export interface ResourceItem<T> {
    values: T,
    status: ResourceStatus
}

/**
 * The unique identifier of a resource collection
 */
export type ResourceCollectionId = string;

/**
 * A collection of a particular resource
 */
export interface ResourceCollection {
    /**
     * A list of ids of resources in the order they appear in that collection.
     */
    positions: string[],

    /**
     * The status information of the resource collection
     */
    status: ResourceStatus,
}

export interface ResourceReduxState<T> {
    /**
     * The set of items of a particular resource type
     */
    items: { [key: string]: ResourceItem<T>; },

    /**
     * The set of collections of a particular resource type
     */
    collections: { [key: string]: ResourceCollection; },

    /**
     * A dictionary of the resources that are currently selected.
     */
    selectionMap: { [key: string]: boolean; },

    /**
     * The temporary key that is being used for a new resource item until it's been saved to a remote API and
     * given a permanent unique identifier.
     */
    newItemKey: string | null,
}

/**
 * Returns an item of a particular resource from a Redux store, removing any structure used implicitly.
 */
export interface GetItemFunction<T> { (currentState: ResourceReduxState<T>, params: object | string): ResourceItem<T> }


/**
 * Collection of resources, with its items in an array
 */
export interface ResourceCollectionWithItems<T> extends ResourceCollection {
    items: Array<ResourceItem<T>>
}

/**
 * Returns a collection of a particular resource from a Redux store, populating it with the correct items, in
 * the right order.
 */
export interface GetCollectionFunction<T> { (currentState: ResourceReduxState<T>, params: object | string): ResourceCollectionWithItems<T> }

/**
 * The type of Redux action that is emitted when that action occurs
 */
export type ActionType = string;

/**
 * Mapping between action names and their types
 */
export type ActionDictionary = {[key: string]: ActionType };

/**
 * An object representing an action being dispatched in the Redux store
 */
export interface ActionObject {
    type: string;
}

/**
 * Function that accepts the current state and Redux action and returns the correct new state.
 */
export interface ReducerFunction<T> { (currentState: ResourceReduxState<T>, action: ActionObject): ResourceReduxState<T> }

/**
 * Performs an asynchronous action and calls dispatch when it is done with a new ActionObject
 */
export interface ActionThunk { (dispatch: Function): void }

/**
 * Function that dispatches an ActionObject or an ActionThunk
 */
export interface ActionCreatorFunction { (...args: any[]): ActionObject | ActionThunk }

/**
 * A dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
 */
export interface ActionCreatorDictionary { [key: string]: ActionCreatorFunction }

export interface ResourcesDefinition<T> {
    /**
     * Mapping between RESTful action names and constant Redux Action names
     */
    actions: ActionDictionary,

    /**
     * Dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
     */
    actionCreators: ActionCreatorDictionary,

    /**
     *  Reducer function that will accept the resource's current state and an action and return the new
     *  resource state
     */
    reducers: ReducerFunction<T>,

    /**
     * Function that returns a particular item of a resource type
     */
    getItem: GetItemFunction<T>,

    /**
     * Function that returns a particular collection of resources
     */
    getCollection: GetCollectionFunction<T>
}

/**
 * A Mapping between the name of an associated resource, and its definition.
 */
export type AssociationOptions<T> = { [key: string]: ResourcesDefinition<T>; }

/**
 * A mapping between an ActionType and the ReducerFunction that should be called when an action of that
 * type is dispatched.
 */
export type ActionReducerFunctionPair<T> = { [key: string]: ReducerFunction<T> }


export interface GlobalConfigurationOptions<T> {
    /**
     * The resource attribute used to key/index all items of the current resource type. This will be the value
     * you pass to each action creator to identify the target of each action. By default, 'id' is used.
     */
    keyBy?: string,

    /**
     * Set to true for resources that should be edited locally, only. The show and index actions are disabled
     * (the fetch* action creators are not exported) and the create, update and destroy only update the store
     * locally, without making any HTTP requests.
     */
    localOnly?: boolean,

    /**
     * The attributes passed to action creators that should be used to create the request URL, but ignored
     * when storing the request's response.
     */
    urlOnlyParams?: Array<string>,

    /**
     * Function used to adapt the responses for requests before it is handed over to the reducers.
     */
    responseAdaptor?: Function,

    /**
     * Function used to adapt the JavaScript object before it is handed over to become the body of the request
     * to be sent to an external API.
     */
    requestAdaptor?: Function,

    /**
     * A list of functions to call before passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional pre-processing to standardise the resource before
     * it is added to the store.
     */
    beforeReducers?: Array<ReducerFunction<T>>,

    /**
     * A list of functions to call after passing the resource to the reducer. This is useful if you want to use
     * the default reducer, but provide some additional post-processing to standardise the resource before it
     * is added to the store.
     */
    afterReducers?: Array<ReducerFunction<T>>,
}

/**
 * Options used to configure the resource and apply to all actions, unless overridden by more specific
 * configuration in ActionOptions.
 */
export interface ResourceOptions<T> extends GlobalConfigurationOptions<T> {
    /**
     * The pluralized name of the resource you are defining.
     */
    name: string,

    /**
     * A url template that is used for all of the resource's actions. The template string can include required
     * url parameters by prefixing them with a colon (e.g. :id) and optional parameters are denoted by adding
     * a question mark at the end (e.g. :id?). This will be used as the default url template, but individual
     * actions may override it with their own.
     */
    url?: string,

    /**
     * A single or list of objects with an action and a reducer, used to specify custom reducers in response to
     * actions external to the current resource.
     */
    reducesOn?: ActionReducerFunctionPair<T> | Array<ActionReducerFunctionPair<T>>,

    /**
     * A single or list of actions for which the current resource should be cleared.
     */
    clearOn?: ActionType | Array<ActionType>,

    /**
     * An object of associated resources, with a many-to-many relationship with the current one.
     */
    hasAndBelongsToMany?: AssociationOptions<T>,

    /**
     * An object of associated resources, with a one-to-many relationship with the current one.
     */
    belongsTo?: AssociationOptions<T>,
}


/**
 * Options used to configure individual resource actions and override any options specified in GlobalOptions
 * or ResourceOptions.
 */
export interface ActionOptions<T> {
    /**
     * The resource attribute used to key/index all items of the current resource type. This will be the value
     * you pass to each action creator to identify the target of each action. By default, 'id' is used.
     */
    keyBy?: string,

    /**
     * Set to true for resources that should be edited locally, only. The show and index actions are disabled
     * (the fetch* action creators are not exported) and the create, update and destroy only update the store
     * locally, without making any HTTP requests.
     */
    localOnly?: boolean,

    /**
     * A url template that is used for the action. The template string can include required url parameters by
     * prefixing them with a colon (e.g. :id) and optional parameters are denoted by adding a question mark at
     * the end (e.g. :id?).
     */
    url?: string,

    /**
     * The attributes passed to the action's creator used to create the request URL, but ignored when storing
     * the request's response.
     */
    urlOnlyParams?: Array<string>,

    /**
     * Whether the store should emit progress events as the resource is uploaded or downloaded. This is
     * applicable to the RESTful actions index, show, create, update and any custom actions.
     */
    progress?: boolean,

    /**
     * Function used to adapt the response for a particular request before it is handed over to the reducers.
     */
    responseAdaptor?: Function,

    /**
     * Function used to adapt the JavaScript object before it is handed over to become the body of the request
     * to be sent to an external API.
     */
    requestAdaptor?: Function,

    /**
     * A custom reducer function to adapt the resource as it exists in the Redux store. By default, the
     * standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful
     * actions.
     */
    reducer?: ReducerFunction<T>,

    /**
     * A list of functions to call before passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional pre-processing to standardise the resource before
     * it is added to the store.A list of functions to call before passing the resource to the reducer. This
     * is useful if you want to use the default reducer, but provide some additional pre-processing to
     * standardise the resource before it is added to the store.
     */
    beforeReducers?: Array<ReducerFunction<T>>,

    /**
     * A list of functions to call after passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional post-processing to standardise the resource
     * before it is added to the store.
     */
    afterReducers?: Array<ReducerFunction<T>>,
}

export type ActionOptionsMap<T> = { [key: string]: ActionOptions<T> | Boolean };

/**
 * Defines a new resource, returning the actions, action creators, reducers and helpers to manage it
 */
export function resources<T>(resourceOptions: ResourceOptions<T>, actionOptions: ActionOptionsMap<T> | string[]): ResourcesDefinition<T>;


/**
 * Serializes an object to create a consistent key, no matter the ordering of the attributes, suitable to use
 * as a key for resource items and collections.
 */
export function serializeKey(target: any): string | ResourceCollectionId;

/**
 * Updates or sets the global configuration options
 */
export function configure(config: GlobalConfigurationOptions<object>): void;

/**
 * Returns the current global configuration options
 */
export function getConfiguration(): GlobalConfigurationOptions<object>;
