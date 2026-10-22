import type { JuniorCommand, RepeatableJuniorCommand } from './commandTypes';
import type { JuniorScene } from './phaserScene';

type RunnableCommand = JuniorCommand | RepeatableJuniorCommand;

export class CommandRunner {
  private stopped = false;

  stop() {
    this.stopped = true;
  }

  async run(scene: JuniorScene, commands: JuniorCommand[], onStep?: (id: string | null) => void) {
    this.stopped = false;
    scene.resetRunState();
    let failed = false;

    for (let index = 0; index < commands.length; index += 1) {
      const command = commands[index];
      if (this.stopped) break;
      onStep?.(command.id);
      scene.beginRouteStep(index);
      const success = await this.executeCommand(scene, command, index);
      if (!success) {
        failed = true;
        break;
      }
      scene.completeRouteStep(index);
    }

    onStep?.(null);
    return !this.stopped && !failed;
  }

  private async executeCommand(scene: JuniorScene, command: RunnableCommand, routeStep = -1): Promise<boolean> {
    const followsRoute = routeStep >= 0 && scene.hasRouteStep(routeStep);

    switch (command.type) {
      case 'start':
        scene.playSound('pop');
        await scene.delay(350);
        return true;
      case 'moveRight':
        if (followsRoute) await scene.moveToRouteStep(routeStep);
        else await scene.moveBy(command.value * 18, 0);
        return true;
      case 'moveLeft':
        if (followsRoute) await scene.moveToRouteStep(routeStep);
        else await scene.moveBy(command.value * -18, 0);
        return true;
      case 'moveUp':
        if (followsRoute) await scene.moveToRouteStep(routeStep);
        else await scene.moveBy(0, command.value * -18);
        return true;
      case 'moveDown':
        if (followsRoute) await scene.moveToRouteStep(routeStep);
        else await scene.moveBy(0, command.value * 18);
        return true;
      case 'turnRight':
        await scene.turn(command.value * 30);
        return true;
      case 'turnLeft':
        await scene.turn(command.value * -30);
        return true;
      case 'jump':
        if (followsRoute) await scene.jumpToRouteStep(routeStep, command.value * 16);
        else await scene.jump(command.value * 16);
        return true;
      case 'say':
        await scene.say(command.text, 2);
        return true;
      case 'recordVoice':
        await scene.playVoiceRecording(command.recordingUrl, command.targetText, command.duration || 3);
        return true;
      case 'writeMessage':
        await scene.say(command.message, 2.4);
        return true;
      case 'sound':
        scene.playSound(command.soundId);
        await scene.delay(450);
        return true;
      case 'wait':
        await scene.delay(command.value * 700);
        return true;
      case 'pick':
        return scene.pickObject(command.objectId);
      case 'drop':
        return scene.dropObject(command.targetId);
      case 'choice':
        return scene.chooseOption(command.choiceId, command.text);
      case 'wudhu':
        return scene.performWudhuAction(command.actionId);
      case 'repeat':
        await scene.showRepeatCue(command.times, command.label);
        for (let count = 0; count < command.times; count += 1) {
          if (this.stopped) return false;
          const success = await this.executeCommand(scene, command.repeatCommand);
          if (!success) return false;
        }
        return true;
      case 'reset':
        scene.resetActor();
        await scene.delay(300);
        return true;
      default:
        return true;
    }
  }
}
