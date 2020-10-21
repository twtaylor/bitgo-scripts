// npx ts-node unspent-selector.ts

// the four things to configure below:
// 1) the source and dest wallets. these are walletId and the address in transaction
// 2) walletPassphrase, 3) accessToken
// 4) feeRate - this is based on the mempool congestion

import { BitGo, Wallet } from 'bitgo';
import { Dimensions, Codes } from '@bitgo/unspents';
import * as _ from 'lodash';

const bitgo = new BitGo({ env: 'prod' });

const coin = 'btc';
const basecoin = bitgo.coin(coin);

/// ----------------------------------------------------
/// CONFIGURATION AREA  - check each of these
/// ----------------------------------------------------

// REMOVE THESE UNSPENTS

// CONFIGURE ALL THIS
// set these in private
const accessToken = '';
const walletPassphrase = '';

const walletId = '';
const feeRate = 80 * 1000;

const destAddress = '';
const unspentIdsToRemove = [ '' ];

const secondSendAmount = 8 * 1e8;
const secondSendAddress = '';

const nOutputs = 2;

/// ----------------------------------------------------
/// CONFIGURATION AREA 
/// ----------------------------------------------------

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });

  let unspents: any[] = (await walletInstance.unspents()).unspents;

  // remove unspents
  const filteredUnspents = _.filter(unspents, n => !_.some(unspentIdsToRemove, t => t == n.id));
  const removedUnspents = _.filter(unspents, n => _.some(unspentIdsToRemove, t => t == n.id));;

  console.dir(filteredUnspents);

  console.log('total = ' + _.sumBy(unspents, n => n.value) / 1e8);
  console.log('value sent = ' + _.sumBy(filteredUnspents, n => n.value) / 1e8);
  console.log('value removed = ' + _.sumBy(removedUnspents, n => n.value) / 1e8);

  const unspentsDimensions = Dimensions.fromUnspents(filteredUnspents)
      // assumes all unspents are p2shp2wsh - basically right for bitgo addrs
      // HAVE TO CHANGE THIS TO THE ADDRESS TYPES YOU'RE DRAWING FROM
      .plus(Dimensions.fromOutputOnChain(Codes.p2shP2wsh.internal)
      .times(nOutputs));

  const vSize = unspentsDimensions.getVSize();

  // total unspents value
  // satoshis per vbyte
  const unspentsValue = _.sumBy(filteredUnspents, 'value');

  // estimated fee - if this feeRate is not div by 1000, gonna have to floor it since it needs to be an integer
  const estimatedFee = unspentsDimensions.getVSize() *  _.floor(feeRate / 1000);

  const sendAmount = unspentsValue - estimatedFee;

  const transaction = await walletInstance.sendMany({
    unspents: _.map(filteredUnspents, 'id'),
    recipients: [
      {
        // this should be a precise value without any change outputs now
        amount: sendAmount - secondSendAmount,
        // coinlist hot address
        address: destAddress,
      },
      {
        amount: secondSendAmount,
        address: secondSendAddress,
      }
    ],
    walletPassphrase,
    feeRate,
  // work around a bug in sendMany
  } as any);

   console.log('New Transaction:', JSON.stringify(transaction, null, 4));
};

main().catch((e) => console.error(e));
