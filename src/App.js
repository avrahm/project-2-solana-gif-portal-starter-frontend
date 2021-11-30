import { useEffect, useState } from 'react';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json';

import './App.css';
import TwitterFooter from './Components/TwitterFooter';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
// processed refers to the transaction being confirmed by the node that your connected too
// finalized refers to the transaction being confirmed by the whole chain
//https://solana-labs.github.io/solana-web3.js/modules.html#Commitment
const opts = {
  preflightCommitment: "processed"
}

const TEST_GIFS = [
  'https://media.giphy.com/media/htFUXJH5vjgIw/giphy.gif',
  'https://media.giphy.com/media/l41m2CdrZUCtgtXWg/giphy.gif',
  'https://media.giphy.com/media/TrXccx2cCI6Xu/giphy.gif',
  'https://media.giphy.com/media/4dL4eV4pNb3MY/giphy.gif'
]

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  /*
  * This function holds the logic for deciding if a Phantom Wallet is
  * connected or not
  */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

          const response = await solana.connect({ onlyIfTrusted: true });

          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());

        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  // provider is a wrapper for the connection to the blockchain
  // which is an authenticated connecion to solana
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  };

  // 
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const sendGif = async (e) => {
    e.preventDefault();
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
      setInputValue('');
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account:", account);
      // let gifListMinusOne = await account.gifList.slice(1, 0);
      setGifList(account.gifList);

    } catch (error) {
      console.error('Error getting the account:', error);
      setGifList(null);
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIFs ... ')
    }
    getGifList();
  }, [walletAddress])

  const ConnectedContainer = () => {

    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={sendGif}
          >
            <input type="text" value={inputValue}
              placeholder="Enter gif link!"
              onChange={e => setInputValue(e.target.value)} />
            <button type="submit" className="cta-button submit-gif-button">Submit</button>
          </form>
          <div className="gif-grid">
            {gifList.map((gif, index) => (
              <div className="gif-item" key={index}>
                <img src={gif.gifLink} alt={gif.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    };
  };

  const ConnectButton = () => {
    return (
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    )
  }

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 <span className=" gradient-text">What GIF's Solana?!</span></p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress ? (
            <ConnectButton />
          ) : (
            <ConnectedContainer />
          )}
        </div>
        <TwitterFooter />
      </div>
    </div>
  );
};



export default App;
