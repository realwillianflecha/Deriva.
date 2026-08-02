'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/state/gameStore';
import { NARRATIVE_NODES } from '@/content/narrative/nodes';
import { requestFlightPointerLock } from '@/lib/canvasRegistry';
import type { NarrativeChoice } from '@/state/types';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';

export default function DecisionPanel() {
  const narrativeVisible = useGameStore((s) => s.narrativeVisible);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const selectChoice = useGameStore((s) => s.selectChoice);
  const phase = useGameStore((s) => s.phase);

  const node = NARRATIVE_NODES[currentNodeId];
  const visible = narrativeVisible && phase !== 'debrief' && node;

  const handleChoice = (choice: NarrativeChoice) => {
    if (choice.action === 'start-flight' || choice.action === 'resume-flight' || choice.action === 'begin-descent') {
      requestFlightPointerLock();
    }
    selectChoice(choice.id);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-8">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto w-full max-w-lg"
          >
            <Panel className="p-4 sm:p-5">
              {node.speaker && (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300/80">
                  {node.speaker}
                </p>
              )}
              <p className="mb-4 text-sm leading-relaxed text-white/90">{node.text}</p>
              <div className="flex flex-col gap-2">
                {node.choices.map((choice) => (
                  <Button key={choice.id} onClick={() => handleChoice(choice)}>
                    {choice.label}
                  </Button>
                ))}
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
