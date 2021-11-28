import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
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

  const sendGif = async (e) => {
    e.preventDefault();

    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
    } else {
      console.log('Empty input. Try again.');
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
    setGifList(TEST_GIFS);
  }, [walletAddress])

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 <span className=" gradient-text">What GIF's Solana?!</span></p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress ? (
            <button
              className="cta-button connect-wallet-button"
              onClick={connectWallet}
            >
              Connect to Wallet
            </button>
          ) : (
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
                {gifList.map(gif => (
                  <div className="gif-item" key={gif}>
                    <img src={gif} alt={gif} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
