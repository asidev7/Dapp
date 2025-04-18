'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique du composant avec SSR désactivé
const ContractFunctions = dynamic(
  () => import('../components/ContractFunctions'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="">
      <main>
        <ContractFunctions />
      </main>

     
    </div>
  );
}