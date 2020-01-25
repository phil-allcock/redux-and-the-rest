/**
 * @typedef {String} StatusType One of the statuses a resource item or resource collection can be in
 */

const SUCCESS = 'SUCCESS';
const PROGRESS = 'PROGRESS';
const ERROR = 'ERROR';
const EDITING = 'EDITING';
const FETCHING = 'FETCHING';
const CREATING = 'CREATING';
const UPDATING = 'UPDATING';
const DESTROYING = 'DESTROYING';
const DESTROY_ERROR = 'DESTROY_ERROR';
const NEW = 'NEW';

export {
  NEW,
  EDITING,

  FETCHING,
  CREATING,
  UPDATING,

  DESTROYING,
  DESTROY_ERROR,

  SUCCESS,
  PROGRESS,
  ERROR,
};
