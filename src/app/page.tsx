'use client';

import { AdvanceScriptTable } from "@/components/custom/AdvanceScriptTable";
import { ScriptTable } from "@/components/custom/ScriptTable";
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      {/* <ScriptTable /> */}
      <AdvanceScriptTable/>
      <div className="px-4 py-10 flex justify-end items-end">
    
      </div>
      
    </main>
  );
}