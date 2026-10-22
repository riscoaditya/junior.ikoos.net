import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { registerJuniorBlocks } from '../blocks/juniorBlocks';
import { toolbox } from '../blocks/toolbox';
import { starterXml } from '../data/templates';

type Props = {
  onWorkspaceReady: (workspace: Blockly.WorkspaceSvg) => void;
};

export default function BlocklyWorkspace({ onWorkspaceReady }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!divRef.current || workspaceRef.current) return;
    registerJuniorBlocks();

    const workspace = Blockly.inject(divRef.current, {
      toolbox,
      trashcan: true,
      scrollbars: true,
      horizontalLayout: false,
      renderer: 'zelos',
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.4, minScale: 0.55, scaleSpeed: 1.1 },
      move: { scrollbars: true, drag: true, wheel: true },
      grid: { spacing: 24, length: 3, colour: '#e2e8f0', snap: true },
    });

    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(starterXml), workspace);
    workspaceRef.current = workspace;
    onWorkspaceReady(workspace);

    const handleResize = () => Blockly.svgResize(workspace);
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [onWorkspaceReady]);

  return <div ref={divRef} className="blockly-workspace" />;
}
