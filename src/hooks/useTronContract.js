'use client';
import { useState, useEffect } from 'react';
import { contractABI } from '../utils/contractABI';
import { CONTRACT_ADDRESS, TRON_NETWORK } from '../utils/contractConfig';

export default function useTronContract() {
  const [tronWeb, setTronWeb] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkType, setNetworkType] = useState(null);

  useEffect(() => {
    const initTronWeb = async () => {
      try {
        // Import dynamique de TronWeb pour éviter l'erreur côté serveur
        const TronWeb = (await import('tronweb')).default;
        
        let tronWebInstance;
        
        // Vérifier si TronLink est installé
        if (window.tronWeb) {
          tronWebInstance = window.tronWeb;
          setTronWeb(tronWebInstance);
          
          // Déterminer le type de réseau
          const network = tronWebInstance.fullNode.host;
          console.log("Réseau détecté:", network);
          if (network.includes('shasta')) {
            setNetworkType('shasta');
          } else if (network.includes('nile')) {
            setNetworkType('nile');
          } else {
            setNetworkType('mainnet');
          }
          
          // Obtenir l'adresse du compte connecté s'il est prêt
          if (tronWebInstance.ready) {
            const accounts = tronWebInstance.defaultAddress.base58;
            setAccount(accounts);
            console.log("Compte connecté:", accounts);
          }
        } else {
          // Créer une instance en lecture seule si TronLink n'est pas installé
          const fullNode = TRON_NETWORK === 'mainnet' 
            ? 'https://api.trongrid.io'
            : 'https://api.shasta.trongrid.io';
          const solidityNode = TRON_NETWORK === 'mainnet'
            ? 'https://api.trongrid.io'
            : 'https://api.shasta.trongrid.io';
          const eventServer = TRON_NETWORK === 'mainnet'
            ? 'https://api.trongrid.io'
            : 'https://api.shasta.trongrid.io';
          
          tronWebInstance = new TronWeb(
            fullNode,
            solidityNode,
            eventServer
          );
          
          setTronWeb(tronWebInstance);
          setNetworkType(TRON_NETWORK);
          setError('Veuillez installer TronLink et vous connecter pour accéder à toutes les fonctionnalités.');
        }
        
        // Initialiser le contrat
        console.log("Tentative d'initialisation du contrat à l'adresse:", CONTRACT_ADDRESS);
        if (tronWebInstance) {
          try {
            const contractInstance = await tronWebInstance.contract(contractABI, CONTRACT_ADDRESS);
            console.log("Contrat initialisé:", contractInstance);
            setContract(contractInstance);
          } catch (contractErr) {
            console.error("Erreur lors de l'initialisation du contrat:", contractErr);
            setError(`Erreur de contrat: ${contractErr.message}`);
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'initialisation de TronWeb:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Vérifier que nous sommes côté client avant d'initialiser TronWeb
    if (typeof window !== 'undefined') {
      initTronWeb();
    
      // Écouter les changements de compte
      const handleAccountsChanged = (e) => {
        if (e.data && e.data.message && e.data.message.action === 'accountsChanged') {
          console.log("Changement de compte détecté");
          if (window.tronWeb) {
            setAccount(window.tronWeb.defaultAddress.base58);
          }
        }
      };
      
      window.addEventListener('message', handleAccountsChanged);
      
      return () => {
        window.removeEventListener('message', handleAccountsChanged);
      };
    } else {
      // Côté serveur, on marque juste comme non chargé
      setLoading(false);
    }
  }, []);

  // Fonction pour se connecter à TronLink
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.tronLink) {
      try {
        console.log("Tentative de connexion à TronLink");
        await window.tronLink.request({ method: 'tron_requestAccounts' });
        
        if (window.tronWeb) {
          setTronWeb(window.tronWeb);
          const accounts = window.tronWeb.defaultAddress.base58;
          console.log("Compte après connexion:", accounts);
          setAccount(accounts);
          
          try {
            console.log("Réinitialisation du contrat après connexion");
            const contractInstance = await window.tronWeb.contract(contractABI, CONTRACT_ADDRESS);
            setContract(contractInstance);
            setError(null);
          } catch (contractErr) {
            console.error("Erreur lors de l'initialisation du contrat après connexion:", contractErr);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la connexion au wallet:", err);
        setError(`Erreur de connexion: ${err.message}`);
      }
    } else {
      setError('TronLink n\'est pas installé. Veuillez installer l\'extension TronLink.');
    }
  };

  return { tronWeb, contract, account, loading, error, connectWallet, networkType };
}