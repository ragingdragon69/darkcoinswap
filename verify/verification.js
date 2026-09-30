/* Standalone MainNet signing page. Discord, not this page, grants verification. */
(function () {
  'use strict';
  const query = new URLSearchParams(location.hash.slice(1));
  const request = { address:query.get('address'),receiver:query.get('receiver'),note:query.get('note'),expires:Number(query.get('expires')) };
  const button = document.getElementById('verify-wallet');
  const status = document.getElementById('verification-status');
  const peraButton = document.getElementById('connect-pera');
  const deflyButton = document.getElementById('connect-defly');
  let activeWallet = null,connectedAddress = null,busy = false;
  const sdk = window.algosdk;
  function show(text) { status.textContent = text; }
  function constructor(names) {
    for (const name of names) { let value = window; for (const part of name.split('.')) value=value?.[part]; if(typeof value==='function') return value; }
    return null;
  }
  function valid() {
    return sdk?.isValidAddress(request.address || '') && sdk.isValidAddress(request.receiver || '')
      && /^darkcoin:verify:[0-9a-f]{48}$/.test(request.note || '') && Number.isSafeInteger(request.expires) && Date.now() <= request.expires;
  }
  const Pera = constructor(['peraWalletConnect.PeraWalletConnect','PeraWalletConnect']);
  const Defly = constructor(['deflyWalletConnect.DeflyWalletConnect','DeflyWalletConnect']);
  const wallets = new Map();
  function walletFor(Constructor) {
    if(!wallets.has(Constructor)) wallets.set(Constructor,new Constructor());
    return wallets.get(Constructor);
  }
  function useSession(wallet,accounts) {
    const address=accounts.find(value=>value===request.address);
    if(!address) return false;
    activeWallet=wallet;connectedAddress=address;
    wallet.connector?.on('disconnect',()=>{
      if(activeWallet===wallet){connectedAddress=null;button.disabled=true;}
    });
    show('Wallet connected. Sign the 0 ALGO verification transaction.');
    button.disabled=!valid();
    return true;
  }
  async function connect(Constructor) {
    if (busy || !valid() || !Constructor) return;
    busy=true;peraButton.disabled=true;deflyButton.disabled=true;button.disabled=true;
    try {
      const wallet=walletFor(Constructor);
      const accounts=await wallet.connect();
      if(!useSession(wallet,accounts)){
        connectedAddress=null;
        show('Connect the wallet shown in your Discord verification request.');
      }
    } catch { show('Wallet connection was not completed. You can try connecting again.'); }
    finally { busy=false;peraButton.disabled=!Pera || !valid();deflyButton.disabled=!Defly || !valid(); }
  }
  async function restoreSession() {
    // Restore the wallet provider's existing session; never extend its expiry or sign automatically.
    busy=true;peraButton.disabled=true;deflyButton.disabled=true;
    try {
      for(const Constructor of [Pera,Defly]) {
        if(!Constructor) continue;
        try {
          const wallet=walletFor(Constructor);
          if(typeof wallet.reconnectSession!=='function') continue;
          const accounts=await bounded(wallet.reconnectSession());
          if(valid() && useSession(wallet,accounts)) break;
        } catch { /* An absent/expired session falls back to the existing Connect buttons. */ }
      }
    } finally {
      busy=false;peraButton.disabled=!Pera || !valid();deflyButton.disabled=!Defly || !valid();
    }
  }
  async function bounded(promise) {
    let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),12000);})]);}
    finally{clearTimeout(timer);}
  }
  async function verify() {
    if(busy || !activeWallet || connectedAddress!==request.address || !valid()) return;
    busy=true;button.disabled=true;peraButton.disabled=true;deflyButton.disabled=true;
    const storageKey='darkcoin-verification:'+request.note;
    let txId=null;
    try {
      txId=sessionStorage.getItem(storageKey);
      const client=new sdk.Algodv2('', 'https://mainnet-api.algonode.cloud',443);
      if(!txId){
        const params=await bounded(client.getTransactionParams().do());
        if((params.genesisID ?? params.genesisId)!=='mainnet-v1.0') throw Error('network');
        const fee=Math.max(1000,Number(params.minFee ?? params['min-fee'] ?? 1000));
        if(!Number.isSafeInteger(fee) || fee>5000) throw Error('fee');
        params.flatFee=true;params.fee=fee;
        const note=new TextEncoder().encode(request.note);
        const txn=typeof sdk.makePaymentTxnWithSuggestedParams==='function'
          ? sdk.makePaymentTxnWithSuggestedParams(connectedAddress,request.receiver,0,undefined,note,params)
          : sdk.makePaymentTxnWithSuggestedParamsFromObject({sender:connectedAddress,receiver:request.receiver,amount:0,note,suggestedParams:params});
        const signed=await activeWallet.signTransaction([[{txn,signers:[connectedAddress]}]]);
        if(!valid()) throw Error('expired');
        txId=String(txn.txID());
        // Persist identity before submission. An uncertain send must not prompt another signing payment.
        sessionStorage.setItem(storageKey,txId);
        await bounded(client.sendRawTransaction(signed).do());
      }
      const result=await bounded(client.pendingTransactionInformation(txId).do());
      if(Number(result.confirmedRound ?? result['confirmed-round'] ?? 0)>0){
        show('Transaction confirmed. Return to Discord to complete verification.');
      } else {
        show('Transaction submitted. Return to Discord to check verification.');
      }
    } catch {
      show(txId ? 'Submission is being checked. Return to Discord to check verification.'
        : 'Signing was not completed. You can try again while this request is valid.');
    } finally {
      busy=false;button.disabled=!!txId || !valid();peraButton.disabled=!!txId || !valid() || !Pera;deflyButton.disabled=!!txId || !valid() || !Defly;
    }
  }
  peraButton.addEventListener('click',()=>connect(Pera));
  deflyButton.addEventListener('click',()=>connect(Defly));
  button.addEventListener('click',verify);
  if(valid()){
    peraButton.disabled=!Pera;deflyButton.disabled=!Defly;
    show('Connect your wallet to continue.');
    void restoreSession();
  }else{
    show('Open a current verification link from Discord to continue.');
  }
})();
