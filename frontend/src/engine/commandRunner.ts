import type { JuniorCommand } from './commandTypes';
import type { JuniorScene } from './phaserScene';

export class CommandRunner {
  private stopped = false;

  stop() {
    this.stopped = true;
  }

  async run(scene: JuniorScene, commands: JuniorCommand[], onStep?: (id: string | null) => void) {
    this.stopped = false;
    scene.resetActor();

    for (const command of commands) {
      if (this.stopped) break;
      onStep?.(command.id);

      switch (command.type) {
        case 'start':
          scene.playSound('pop');
          await scene.delay(350);
          break;
        case 'moveRight':
          await scene.moveBy(command.value * 18, 0);
          break;
        case 'moveLeft':
          await scene.moveBy(command.value * -18, 0);
          break;
        case 'moveUp':
          await scene.moveBy(0, command.value * -18);
          break;
        case 'moveDown':
          await scene.moveBy(0, command.value * 18);
          break;
        case 'turnRight':
          await scene.turn(command.value * 30);
          break;
        case 'turnLeft':
          await scene.turn(command.value * -30);
          break;
        case 'jump':
          await scene.jump(command.value * 16);
          break;
        case 'say':
          await scene.say(command.text, 2);
          break;
        case 'sound':
          scene.playSound(command.soundId);
          await scene.delay(450);
          break;
        case 'wait':
          await scene.delay(command.value * 700);
          break;
        case 'reset':
          scene.resetActor();
          await scene.delay(300);
          break;
      }
    }

    onStep?.(null);
  }
}
