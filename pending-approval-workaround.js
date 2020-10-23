const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'prod' });
const Promise = require('bluebird');

const coin = 'btc';
const basecoin = bitgo.coin(coin);

//  wallet
const walletId = '';

// pull from localStorage > Session Storage > BG.Tokens.token in the UI
const accessToken = "";

// tap OTP here
const otp = '';

// this is the pending approval for the tx - can pull this from UI network tab
const pendingApprovalId = '';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = yield basecoin.wallets()
    .get({ id: walletId });

  // assume one pending approval
  const rgrPendingApproval = walletInstance.pendingApprovals()[0];

  console.dir(rgrPendingApproval, { depth: 4 });

  if (rgrPendingApproval._pendingApproval.id === pendingApprovalId) {
    const approve = yield rgrPendingApproval.approve({ otp });
    console.log(approve);
  }
})();
