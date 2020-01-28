import { resources, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';
import fetchMock from 'fetch-mock';
import { COMPLETE, PREVIEW } from '../../../index';

describe('projection:', function () {
  describe('when configuring the INDEX action', function() {
    describe('and the projection value is NOT set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchUsers } } = resources({
          name: 'users',
          url: 'http://test.com/users',
          keyBy: 'id'
        }, {
          index: true
        });

        this.fetchUsers = fetchUsers;

        this.store = buildStore({
          users: {
            ...RESOURCES
          }
        }, { users: reducers } );

        fetchMock.get('http://test.com/users', {
          body: [{ id: 1, username: 'Robert' }],
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('and the projection type is NOT set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUsers());

          this.user = this.store.getState().users.items[1];
        });

        describe('before the request has completed', function () {
          it('then the item and collection\'s projection type is COMPLETE', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual(COMPLETE);
            expect(this.store.getState().users.collections[''].projection.type).toEqual(COMPLETE);
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();
          });

          it('then the item and collection\'s projection type is COMPLETE', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual(COMPLETE);
            expect(this.store.getState().users.collections[''].projection.type).toEqual(COMPLETE);
          });
        });
      });

      describe('and the projection type is set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUsers({}, { projection: { type: PREVIEW }}));
        });

        describe('before the request has completed', function () {
          it('then uses the value passed to the action creator for the item\'s projection type', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual(PREVIEW);
            expect(this.store.getState().users.collections[''].projection.type).toEqual(PREVIEW);
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();
          });

          it('then uses the value passed to the action creator for the item\'s projection type', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual(PREVIEW);
            expect(this.store.getState().users.collections[''].projection.type).toEqual(PREVIEW);
          });
        });
      });
    });

    describe('and the projection type is set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchUsers } } = resources({
          name: 'users',
          url: 'http://test.com/users',
          keyBy: 'id',
          projection: { type: 'RESOURCE_PROJECTION' }
        }, {
          index: true
        });


        this.fetchUsers = fetchUsers;

        this.store = buildStore({
          users: {
            ...RESOURCES
          }
        }, { users: reducers } );

        fetchMock.get('http://test.com/users', {
          body: [{ id: 1, username: 'Robert' }],
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('and the projection type is NOT set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUsers());
        });

        describe('before the request has completed', function () {
          it('then the item and collection\'s projection type is the value specified when defining the resource', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual('RESOURCE_PROJECTION');
            expect(this.store.getState().users.collections[''].projection.type).toEqual('RESOURCE_PROJECTION');
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();
          });

          it('then the item and collection\'s projection type is the value specified when defining the resource', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual('RESOURCE_PROJECTION');
            expect(this.store.getState().users.collections[''].projection.type).toEqual('RESOURCE_PROJECTION');
          });
        });
      });

      describe('and the projection type is set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUsers({}, { projection: { type: 'ACTION_CREATOR_PROJECTION' }}));
        });

        describe('before the request has completed', function () {
          it('then uses the value passed to the action creator for the item and collection\'s projection type', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual('ACTION_CREATOR_PROJECTION');
            expect(this.store.getState().users.collections[''].projection.type).toEqual('ACTION_CREATOR_PROJECTION');
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();
          });

          it('then uses the value passed to the action creator for the item and collection\'s projection type', function() {
            expect(this.store.getState().users.items[1].projection.type).toEqual('ACTION_CREATOR_PROJECTION');
            expect(this.store.getState().users.collections[''].projection.type).toEqual('ACTION_CREATOR_PROJECTION');
          });
        });
      });
    });
  });

  describe('when configuring the SHOW action', function() {
    describe('and the projection type is NOT set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id'
        }, {
          show: true
        });

        this.reducers = reducers;
        this.fetchUser = fetchUser;

        this.store = buildStore({
          users: {
            ...RESOURCES
          }
        }, { users: this.reducers } );

        fetchMock.get('http://test.com/users/1', {
          body: { id: 1, username: 'Robert' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('and the projection type is NOT set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUser(1));

          this.user = this.store.getState().users.items[1]
        });

        describe('before the request has completed', function () {
          it('then the item\'s projection type is COMPLETE', function() {
            expect(this.user.projection.type).toEqual(COMPLETE);
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();

            this.user = this.store.getState().users.items[1];
          });

          it('then the item\'s projection type is COMPLETE', function() {
            expect(this.user.projection.type).toEqual(COMPLETE);
          });
        });
      });

      describe('and the projection type is set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUser(1, { projection: { type: PREVIEW }}));

          this.user = this.store.getState().users.items[1]
        });

        describe('before the request has completed', function () {
          it('then uses the value passed to the action creator for the item\'s projection type', function() {
            expect(this.user.projection.type).toEqual(PREVIEW);
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();

            this.user = this.store.getState().users.items[1];
          });

          it('then uses the value passed to the action creator for the item\'s projection type', function() {
            expect(this.user.projection.type).toEqual(PREVIEW);
          });
        });
      });
    });

    describe('and the projection type is set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id',
          projection: { type: 'RESOURCE_PROJECTION' }
        }, {
          show: true
        });

        this.fetchUser = fetchUser;

        this.store = buildStore({
          users: {
            ...RESOURCES
          }
        }, { users: reducers } );

        fetchMock.get('http://test.com/users/1', {
          body: { id: 1, username: 'Robert' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('and the projection type is NOT set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUser(1));

          this.user = this.store.getState().users.items[1]
        });

        describe('before the request has completed', function () {
          it('then the item\'s projection type is the value specified when defining the resource', function() {
            expect(this.user.projection.type).toEqual('RESOURCE_PROJECTION');
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();

            this.user = this.store.getState().users.items[1];
          });

          it('then the item\'s projection type is the value specified when defining the resource', function() {
            expect(this.user.projection.type).toEqual('RESOURCE_PROJECTION');
          });
        });
      });

      describe('and the projection type is set when calling the action creator', function() {
        beforeAll(function () {
          this.store.dispatch(this.fetchUser(1, { projection: { type: 'ACTION_CREATOR_PROJECTION' }}));

          this.user = this.store.getState().users.items[1]
        });

        describe('before the request has completed', function () {
          it('then uses the value passed to the action creator for the item\'s projection type', function() {
            expect(this.user.projection.type).toEqual('ACTION_CREATOR_PROJECTION');
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            this.resolveRequest();

            this.user = this.store.getState().users.items[1];
          });

          it('then uses the value passed to the action creator for the item\'s projection type', function() {
            expect(this.user.projection.type).toEqual('ACTION_CREATOR_PROJECTION');
          });
        });
      });
    });
  });
});