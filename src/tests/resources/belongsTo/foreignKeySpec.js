import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../../index';
import buildStore from '../../helpers/buildStore';

describe('belongsTo:', function () {
  describe('when the \'foreignKey\' option is used', function () {
    beforeAll(function () {
      this.initialState = {
        users: {
          items: {
            1: {
              values: {
                id: 1,
                username: 'Bob',
                addressId: 1
              },
              status: { type: SUCCESS }
            },
          },
          collections: {
            '': {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: null
        },
        addresses: {
          ...RESOURCES,
        }
      };

      /**
       * @type {{ actions, reducers, createAddress }}
       */
      this.addresses = resources({
        name: 'addresses',
        url: 'http://test.com/addresses/:id?',
        keyBy: 'id'
      }, { create: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: {
          addresses: {
            ...this.addresses,
            foreignKey: 'residentIdentity'
          },
        }
      }, {
        new: true,
      });

      this.reducers = reducers;
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        fetchMock.post('http://test.com/addresses', new Promise(resolve => {}));

        this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

        this.store.dispatch(this.addresses.actionCreators.createAddress('temp', { residentIdentity: 1, city: 'City 3' }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expect(this.store.getState().users.items[1].values.addressId).toEqual('temp');
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        fetchMock.post('http://test.com/addresses', {
          body: { id: 3, residentIdentity: 1, city: 'City 3' },
        });

        this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

        this.store.dispatch(this.addresses.actionCreators.createAddress('temp', { residentIdentity: 1, city: 'City 3' }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expect(this.store.getState().users.items[1].values.addressId).toEqual(3);
      });
    });
  });
});
