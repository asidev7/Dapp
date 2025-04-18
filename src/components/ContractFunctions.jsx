'use client';
import { useState, useEffect } from 'react';
import useTronContract from '../hooks/useTronContract';
import { CONTRACT_ADDRESS } from '../utils/contractConfig';

export default function ContractFunctions() {
  const { contract, account, loading, error, connectWallet } = useTronContract();
  const [contractName, setContractName] = useState('');
  const [contractSymbol, setContractSymbol] = useState('');
  const [contractDecimals, setContractDecimals] = useState(0);
  const [userBalance, setUserBalance] = useState('0');
  
  // États pour le formulaire de transfert
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txStatusType, setTxStatusType] = useState(''); // 'success', 'error', 'info'
  const [allFunctions, setAllFunctions] = useState([]);
  
  // États pour le menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchContractInfo = async () => {
      if (contract) {
        try {
          // Récupérer toutes les fonctions disponibles du contrat
          const functionsList = [];
          for (const key in contract) {
            if (typeof contract[key] === 'function' && key !== 'constructor') {
              functionsList.push(key);
            }
          }
          setAllFunctions(functionsList);
          
          // Récupérer les infos de base du token
          if (functionsList.includes('name')) {
            try {
              const name = await contract.name().call();
              setContractName(name);
            } catch (e) {
              console.error("Erreur lors de la récupération du nom:", e);
            }
          }
          
          if (functionsList.includes('symbol')) {
            try {
              const symbol = await contract.symbol().call();
              setContractSymbol(symbol);
            } catch (e) {
              console.error("Erreur lors de la récupération du symbole:", e);
            }
          }
          
          if (functionsList.includes('decimals')) {
            try {
              const decimals = await contract.decimals().call();
              setContractDecimals(parseInt(decimals));
            } catch (e) {
              console.error("Erreur lors de la récupération des décimales:", e);
            }
          }
          
          // Récupérer le solde si un compte est connecté
          if (account && functionsList.includes('balanceOf')) {
            try {
              const balance = await contract.balanceOf(account).call();
              const decimals = functionsList.includes('decimals') ? 
                parseInt(await contract.decimals().call()) : 0;
              setUserBalance(balance.toString() / Math.pow(10, decimals));
            } catch (e) {
              console.error("Erreur lors de la récupération du solde:", e);
            }
          }
        } catch (err) {
          console.error("Erreur lors de la récupération des informations du contrat:", err);
        }
      }
    };
    
    fetchContractInfo();
  }, [contract, account]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) {
      setTxStatusType('error');
      setTxStatus('Veuillez vous connecter à TronLink');
      return;
    }
    
    try {
      setTxStatusType('info');
      setTxStatus('Transaction en cours...');
      
      // Convertir le montant en unités du token (avec les décimales)
      const amount = (parseFloat(transferAmount) * Math.pow(10, contractDecimals)).toString();
      
      // Exécuter la transaction
      const tx = await contract.transfer(transferTo, amount).send();
      
      setTxStatusType('success');
      setTxStatus(`Transaction réussie! Hash: ${tx}`);
      
      // Mettre à jour le solde
      const balance = await contract.balanceOf(account).call();
      setUserBalance(balance.toString() / Math.pow(10, contractDecimals));
      
      // Réinitialiser le formulaire
      setTransferTo('');
      setTransferAmount('');
    } catch (err) {
      console.error("Erreur de transfert:", err);
      setTxStatusType('error');
      setTxStatus(`Erreur: ${err.message}`);
    }
  };

  // Fonction pour exécuter une fonction en lecture seule
  const executeReadFunction = async (functionName) => {
    if (!contract) return;
    
    try {
      // Pour une fonction simple sans paramètres
      const result = await contract[functionName]().call();
      alert(`${functionName}: ${result}`);
    } catch (err) {
      console.error(`Erreur lors de l'exécution de ${functionName}:`, err);
      alert(`Erreur: ${err.message}`);
    }
  };

  // Formatage d'adresse pour l'affichage dans la navbar
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">T</span>
                </div>
                <span className="ml-2 text-white font-bold text-xl">
                  {contractSymbol || 'TRC20'} <span className="text-blue-200 font-normal">Dashboard</span>
                </span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                <a href="#" className="text-white font-medium px-3 py-2 rounded-md hover:bg-blue-500 transition-colors">Dashboard</a>
                <a href="#" className="text-blue-200 hover:text-white font-medium px-3 py-2 rounded-md hover:bg-blue-500 transition-colors">Explorer</a>
                <a href="#" className="text-blue-200 hover:text-white font-medium px-3 py-2 rounded-md hover:bg-blue-500 transition-colors">Stats</a>
                <a href="#" className="text-blue-200 hover:text-white font-medium px-3 py-2 rounded-md hover:bg-blue-500 transition-colors">Documentation</a>
              </div>
            </div>
            
            {/* Wallet Connection Button & User Info */}
            <div className="flex items-center">
              {account ? (
                <div className="flex items-center bg-blue-800 bg-opacity-40 rounded-full py-1 pl-3 pr-1">
                  <div className="mr-2">
                    <p className="text-xs text-blue-200">Connecté</p>
                    <p className="text-sm text-white font-medium">{formatAddress(account)}</p>
                  </div>
                  <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">{contractSymbol?.charAt(0) || 'T'}</span>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="relative inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 border border-transparent rounded-full transition-colors shadow-lg text-white font-medium"
                >
                  <span className="flex items-center">
                    <span className="h-4 w-4 bg-white rounded-full mr-2"></span>
                    Connecter TronLink
                  </span>
                </button>
              )}
              
              {/* Mobile menu button */}
              <div className="ml-4 md:hidden flex items-center">
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                  className="p-2 rounded-md text-blue-200 hover:text-white focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#" className="block px-3 py-2 rounded-md text-white font-medium bg-blue-800">Dashboard</a>
              <a href="#" className="block px-3 py-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600">Explorer</a>
              <a href="#" className="block px-3 py-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600">Stats</a>
              <a href="#" className="block px-3 py-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600">Documentation</a>
            </div>
          </div>
        )}
      </nav>
      
      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Contract Info Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Informations du Contrat</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-500 mb-1">Nom du Token</p>
                  <p className="font-medium text-gray-800">{contractName || 'Non disponible'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-500 mb-1">Symbole</p>
                    <p className="font-medium text-gray-800">{contractSymbol || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-500 mb-1">Décimales</p>
                    <p className="font-medium text-gray-800">{contractDecimals}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-500 mb-1">Adresse du Contrat</p>
                  <p className="font-mono text-gray-800 text-xs break-all">{CONTRACT_ADDRESS}</p>
                </div>
              </div>
            </div>
            
            {/* Account Info Card */}
            {account ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-green-500 to-green-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Votre Compte</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-500 mb-1">Adresse</p>
                    <p className="font-mono text-xs text-gray-800 break-all">{account}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-green-500 mb-1">Solde</p>
                        <p className="text-2xl text-gray-800 font-bold">
                          {parseFloat(userBalance).toLocaleString(undefined, {maximumFractionDigits: 6})}
                          <span className="text-gray-800 ml-2 text-base">{contractSymbol}</span>
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Connexion Requise</h2>
                </div>
                <div className="p-8 flex flex-col items-center justify-center">
                  <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center text-3xl mb-4">
                    
                  </div>
                  <p className="text-gray-600 mb-6 text-center">Connectez votre portefeuille TronLink pour accéder à toutes les fonctionnalités</p>
                  <button 
                    onClick={connectWallet}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md w-full"
                  >
                    Connecter TronLink
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-xl text-red-500 mr-4">
                    
                  </div>
                  <div>
                    <h3 className="text-red-800 font-medium mb-2">Erreur de Connexion</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                      onClick={connectWallet}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all"
                    >
                      Connecter TronLink
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transfer Form */}
            {account && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Transférer des Tokens</h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleTransfer} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse du Destinataire
                        </label>
                        <input
                          type="text"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="Adresse TRX du destinataire"
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant à Transférer
                        </label>
                        <div className="flex rounded-lg border border-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                          <input
                            type="number"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            placeholder="0.00"
                            step="any"
                            min="0"
                            required
                            className="w-full px-4 py-3 outline-none"
                          />
                          <div className="px-4 py-3 bg-gray-200 flex items-center font-medium text-gray-600">
                            {contractSymbol}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                          <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                        Transférer les Tokens
                      </button>
                    </div>
                    
                    {/* Status Message */}
                    {txStatus && (
                      <div className={`p-4 rounded-lg ${
                        txStatusType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
                        txStatusType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 
                        'bg-blue-50 border border-blue-200 text-blue-800'
                      }`}>
                        <div className="flex">
                          <div className="shrink-0">
                            {txStatusType === 'success' ? (
                              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : txStatusType === 'error' ? (
                              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm">{txStatus}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
            
            {/* Contract Functions */}
            {account && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Fonctions du Contrat</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allFunctions.map((functionName) => (
                      <div key={functionName} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border border-gray-200 transition-all">
                        <h3 className="font-medium mb-3 truncate" title={functionName}>
                          {functionName}
                        </h3>
                        <button 
                          onClick={() => executeReadFunction(functionName)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                        >
                          Exécuter (lecture)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
      
        <div className="mt-10 text-center text-gray-500 text-sm">
    <p>
      © {new Date().getFullYear()} - Dashboard TRC20 | Interface développée pour les contrats intelligents TRON,
      <br />
      Développée par <a href="https://idohouaugustin.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Asidev (idohouaugustin.com)</a>
    </p>
  </div>

      </div>
    </div>
  );
}