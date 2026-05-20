import Phaser from 'phaser';
import type { StageCharacter, StageManifest, StageObject } from '../types/stageAsset';

export type StageReadyPayload = { scene: JuniorScene };

function isSvg(path: string) {
  return path.toLowerCase().split('?')[0].endsWith('.svg');
}

export class JuniorScene extends Phaser.Scene {
  private bg?: Phaser.GameObjects.Image;
  private actor?: Phaser.GameObjects.Image;
  private bubble?: Phaser.GameObjects.Container;
  private stageManifest: StageManifest;
  private selectedBackgroundId: string;
  private selectedCharacterId: string;
  private selectedCharacter?: StageCharacter;
  public readyCallback?: (payload: StageReadyPayload) => void;

  constructor(stageManifest: StageManifest, selectedBackgroundId?: string, selectedCharacterId?: string) {
    super('JuniorScene');
    this.stageManifest = stageManifest;
    this.selectedBackgroundId = selectedBackgroundId || stageManifest.backgrounds[0]?.id || '';
    this.selectedCharacterId = selectedCharacterId || stageManifest.characters[0]?.id || '';
  }

  preload() {
    this.stageManifest.backgrounds.forEach((item) => {
      if (isSvg(item.file)) this.load.svg(item.id, item.file);
      else this.load.image(item.id, item.file);
    });

    this.stageManifest.characters.forEach((item) => {
      if (isSvg(item.file)) this.load.svg(item.id, item.file);
      else this.load.image(item.id, item.file);
    });

    this.stageManifest.objects?.forEach((item) => {
      if (isSvg(item.file)) this.load.svg(item.id, item.file);
      else this.load.image(item.id, item.file);
    });

    this.stageManifest.sounds?.forEach((item) => this.load.audio(item.id, item.file));
  }

  create() {
    const { width, height } = this.scale;
    const defaultBg = this.selectedBackgroundId || this.stageManifest.backgrounds[0]?.id;
    const defaultChar = this.selectedCharacterId || this.stageManifest.characters[0]?.id;

    this.bg = this.add.image(width / 2, height / 2, defaultBg);
    this.fitBackgroundToStage();
    this.renderObjects(this.stageManifest.objects || []);
    this.createActor(defaultChar);

    this.readyCallback?.({ scene: this });
  }

  private renderObjects(objects: StageObject[]) {
    objects.forEach((item) => {
      if (!this.textures.exists(item.id)) return;
      const object = this.add.image(item.position?.x || 0, item.position?.y || 0, item.id);
      if (item.displaySize) object.setDisplaySize(item.displaySize.width, item.displaySize.height);
      else if (item.scale) object.setScale(item.scale);
      object.setDepth(1);
    });
  }

  private createActor(id: string) {
    const { width, height } = this.scale;
    const character = this.stageManifest.characters.find((item) => item.id === id) || this.stageManifest.characters[0];
    this.selectedCharacter = character;
    const x = character?.startPosition?.x ?? width / 2;
    const y = character?.startPosition?.y ?? height * 0.68;
    this.actor = this.add.image(x, y, character?.id || id).setDepth(2);
    if (character?.displaySize) this.actor.setDisplaySize(character.displaySize.width, character.displaySize.height);
    else this.actor.setDisplaySize(125, 125);
  }

  setBackground(id: string) {
    if (!this.bg || !this.textures.exists(id)) return;
    this.selectedBackgroundId = id;
    this.bg.setTexture(id);
    this.fitBackgroundToStage();
  }

  /**
   * Menjaga background agar tidak penyet.
   * Default: cover, sehingga panggung penuh tanpa distorsi.
   * Jika ingin seluruh background terlihat, set `fit: "contain"` di manifest background.
   */
  private fitBackgroundToStage() {
    if (!this.bg || !this.selectedBackgroundId) return;

    const texture = this.textures.get(this.selectedBackgroundId);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const sourceWidth = source?.width || 1280;
    const sourceHeight = source?.height || 720;
    const stageWidth = this.scale.width;
    const stageHeight = this.scale.height;

    const selectedBg = this.stageManifest.backgrounds.find((item) => item.id === this.selectedBackgroundId);
    const fitMode = selectedBg?.fit || 'cover';
    const scaleX = stageWidth / sourceWidth;
    const scaleY = stageHeight / sourceHeight;
    const scale = fitMode === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

    this.bg.setOrigin(0.5);
    this.bg.setPosition(stageWidth / 2, stageHeight / 2);
    this.bg.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
  }

  setCharacter(id: string) {
    if (!this.actor || !this.textures.exists(id)) return;
    const character = this.stageManifest.characters.find((item) => item.id === id);
    this.selectedCharacterId = id;
    this.selectedCharacter = character;
    this.actor.setTexture(id);
    if (character?.displaySize) this.actor.setDisplaySize(character.displaySize.width, character.displaySize.height);
    this.resetActor();
  }

  async moveBy(dx: number, dy: number) {
    if (!this.actor) return;
    const { width, height } = this.scale;
    const nextX = Phaser.Math.Clamp(this.actor.x + dx, 54, width - 54);
    const nextY = Phaser.Math.Clamp(this.actor.y + dy, 60, height - 54);
    await this.tweenPromise({ targets: this.actor, x: nextX, y: nextY, duration: 520, ease: 'Sine.easeInOut' });
  }

  async moveForward(steps: number) {
    if (!this.actor) return;
    const rad = Phaser.Math.DegToRad(this.actor.angle);
    await this.moveBy(Math.cos(rad) * steps, Math.sin(rad) * steps);
  }

  async turn(degrees: number) {
    if (!this.actor) return;
    await this.tweenPromise({ targets: this.actor, angle: this.actor.angle + degrees, duration: 350, ease: 'Back.easeOut' });
  }

  async jump(height: number) {
    if (!this.actor) return;
    const startY = this.actor.y;
    await this.tweenPromise({ targets: this.actor, y: startY - height, duration: 260, ease: 'Sine.easeOut' });
    await this.tweenPromise({ targets: this.actor, y: startY, duration: 320, ease: 'Bounce.easeOut' });
  }

  async say(text: string, seconds = 2) {
    if (!this.actor) return;
    this.hideBubble();

    const stageWidth = this.scale.width;
    const stageHeight = this.scale.height;
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '38px',
      color: '#12305f',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: 400, useAdvancedWrap: true },
    };
    const bubbleText = this.add.text(0, 0, text, {
      ...textStyle,
    }).setOrigin(0.5);

    const bubbleWidth = Phaser.Math.Clamp(bubbleText.width + 78, 360, 540);
    const bubbleHeight = Math.max(118, bubbleText.height + 58);
    const actorHeight = this.actor.displayHeight || 180;
    const bubbleX = Phaser.Math.Clamp(
      this.actor.x + bubbleWidth * 0.24,
      bubbleWidth / 2 + 28,
      stageWidth - bubbleWidth / 2 - 28,
    );
    const bubbleY = Phaser.Math.Clamp(
      this.actor.y - actorHeight * 0.72,
      bubbleHeight / 2 + 28,
      stageHeight - bubbleHeight / 2 - 28,
    );
    const tailAnchorX = Phaser.Math.Clamp(this.actor.x - bubbleX + 34, -bubbleWidth / 2 + 78, bubbleWidth / 2 - 78);
    const bubbleGraphics = this.add.graphics();

    bubbleGraphics.fillStyle(0x17345e, 0.18);
    bubbleGraphics.fillRoundedRect(-bubbleWidth / 2 + 8, -bubbleHeight / 2 + 10, bubbleWidth, bubbleHeight, 28);
    bubbleGraphics.fillStyle(0xffffff, 0.98);
    bubbleGraphics.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 28);
    bubbleGraphics.lineStyle(8, 0xffd45c, 1);
    bubbleGraphics.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 28);
    bubbleGraphics.lineStyle(3, 0xb76a18, 0.38);
    bubbleGraphics.strokeRoundedRect(-bubbleWidth / 2 + 8, -bubbleHeight / 2 + 8, bubbleWidth - 16, bubbleHeight - 16, 22);
    bubbleGraphics.fillStyle(0xffffff, 0.98);
    bubbleGraphics.fillTriangle(
      tailAnchorX - 34,
      bubbleHeight / 2 - 6,
      tailAnchorX + 14,
      bubbleHeight / 2 - 6,
      tailAnchorX - 20,
      bubbleHeight / 2 + 46,
    );
    bubbleGraphics.lineStyle(7, 0xffd45c, 1);
    bubbleGraphics.beginPath();
    bubbleGraphics.moveTo(tailAnchorX - 34, bubbleHeight / 2 - 6);
    bubbleGraphics.lineTo(tailAnchorX - 20, bubbleHeight / 2 + 46);
    bubbleGraphics.lineTo(tailAnchorX + 14, bubbleHeight / 2 - 6);
    bubbleGraphics.strokePath();
    bubbleGraphics.fillStyle(0xffd45c, 0.55);
    bubbleGraphics.fillCircle(-bubbleWidth / 2 + 34, -bubbleHeight / 2 + 28, 8);
    bubbleGraphics.fillStyle(0x16a34a, 0.18);
    bubbleGraphics.fillCircle(bubbleWidth / 2 - 38, bubbleHeight / 2 - 30, 14);

    this.bubble = this.add.container(bubbleX, bubbleY, [bubbleGraphics, bubbleText])
      .setDepth(8)
      .setAlpha(0)
      .setScale(0.86);
    this.tweens.add({
      targets: this.bubble,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
    await this.delay(seconds * 1000);
    this.hideBubble();
  }

  playSound(id: string) {
    if (!this.cache.audio.exists(id)) return;
    this.sound.play(id, { volume: 0.55 });
  }

  resetActor() {
    if (!this.actor) return;
    const { width, height } = this.scale;
    const x = this.selectedCharacter?.startPosition?.x ?? width / 2;
    const y = this.selectedCharacter?.startPosition?.y ?? height * 0.68;
    this.actor.setPosition(x, y);
    this.actor.setAngle(0);
  }

  private hideBubble() {
    this.bubble?.destroy(true);
    this.bubble = undefined;
  }

  delay(ms: number) {
    return new Promise<void>((resolve) => this.time.delayedCall(ms, () => resolve()));
  }

  tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((resolve) => {
      this.tweens.add({ ...config, onComplete: () => resolve() });
    });
  }
}

export function createGame(parent: HTMLDivElement, stageManifest: StageManifest, onReady: (scene: JuniorScene) => void, selectedBackgroundId?: string, selectedCharacterId?: string) {
  const scene = new JuniorScene(stageManifest, selectedBackgroundId, selectedCharacterId);
  scene.readyCallback = ({ scene }) => onReady(scene);
  const virtualWidth = stageManifest.stageSize?.width || 1280;
  const virtualHeight = stageManifest.stageSize?.height || 720;
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: virtualWidth,
    height: virtualHeight,
    backgroundColor: '#dff6ff',
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  });
}
