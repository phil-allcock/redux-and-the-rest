import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';

describe('Generating key:', function () {
  describe('when the urlOnlyParams option is not used', function () {
    beforeAll(function () {
      const {
        reducers,
        actionCreators: { fetchUsers }
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id'
      }, {
        index: true,
      });

      this.fetchUsers = fetchUsers;
      this.reducers = reducers;
    });

    describe('when no value is provided', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses an empty string as the key', function() {
        return this.store.dispatch(this.fetchUsers()).then(() => {
          const collection = this.store.getState().users.collections[''];

          expect(collection.positions).toEqual([ 1 ]);
          expect(collection.status.type).toEqual(SUCCESS);
        });
      });
    });

    describe('when an object is provided with only the id', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users/newest', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the id as a key', function() {
        return this.store.dispatch(this.fetchUsers({ id: 'newest' })).then(() => {
          const collection = this.store.getState().users.collections['id=newest'];

          expect(collection.positions).toEqual([ 1 ]);
          expect(collection.status.type).toEqual(SUCCESS);
        });
      });
    });

    describe('when an object is provided without the id attribute', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users?order=newest&page=1', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses a serialised version of the object as a key', function() {
        return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 1 })).then(() => {
          const collection = this.store.getState().users.collections['order=newest.page=1'];

          expect(collection.positions).toEqual([ 1 ]);
          expect(collection.status.type).toEqual(SUCCESS);
        });
      });
    });
  });

  describe('when the urlParamsOnly is used', function () {
    beforeAll(function () {
      const {
        reducers,
        actionCreators: { fetchUsers },
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        urlOnlyParams: [ 'page' ]
      }, {
        index: true,
      });

      this.reducers = reducers;
      this.fetchUsers = fetchUsers;
    });

    describe('when an object with the attribute mentioned in urlOnlyParams is used', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users?order=newest&page=1', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
        this.store = null;
      });

      it('then does NOT use that attribute in the serialised object used for the key', function() {
        return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 1 })).then(() => {
          const collection = this.store.getState().users.collections['order=newest'];

          expect(collection.positions).toEqual([ 1 ]);
          expect(collection.status.type).toEqual(SUCCESS);
        });
      });
    });

    describe('when an object with the attribute mentioned in urlOnlyParams is used', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users?order=newest&page=1', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        fetchMock.get('http://test.com/users?order=newest&page=2', {
          body: [ { id: 2, username: 'Jane' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
        this.store = null;
      });

      it('then overrides the results for the index action', function() {
        return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 1 })).then(() => {
          return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 2 })).then(() => {
            this.users = this.store.getState().users;

            expect(this.users.items[1].values).toEqual({ id: 1, username: 'Bob' });
            expect(this.users.items[1].status.type).toEqual(SUCCESS);
            expect(this.users.items[2].values).toEqual({ id: 2, username: 'Jane' });
            expect(this.users.items[2].status.type).toEqual(SUCCESS);

            expect(this.users.collections['order=newest'].positions).toEqual([ 2 ]);
          });
        });
      });
    });
  });
});
