import Phaser from 'phaser';
import type { JuniorCommand } from './commandTypes';
import type { StageCharacter, StageManifest, StageObject, StageReward, StageRoute } from '../types/stageAsset';

export type StageReadyPayload = { scene: JuniorScene };

type RenderedStageObject = {
  data: StageObject;
  image: Phaser.GameObjects.Image;
  halo?: Phaser.GameObjects.Graphics;
  labelBg?: Phaser.GameObjects.Graphics;
  label?: Phaser.GameObjects.Text;
};

export class JuniorScene extends Phaser.Scene {
  private bg?: Phaser.GameObjects.Image;
  private actor?: Phaser.GameObjects.Image;
  private bubble?: Phaser.GameObjects.Container;
  private objectViews = new Map<string, RenderedStageObject>();
  private carriedObjectId?: string;
  private carriedBadge?: Phaser.GameObjects.Container;
  private routeGraphics?: Phaser.GameObjects.Graphics;
  private routeHintGraphics?: Phaser.GameObjects.Graphics;
  private routeMarkers: Phaser.GameObjects.Graphics[] = [];
  private routeLabels: Phaser.GameObjects.Text[] = [];
  private currentRouteCommands: JuniorCommand[] = [];
  private activeRouteStep = -1;
  private completedRouteStep = -1;
  private stageManifest: StageManifest;
  private currentObjects: StageObject[];
  private currentRoute?: StageRoute;
  private selectedBackgroundId: string;
  private selectedCharacterId: string;
  private selectedCharacter?: StageCharacter;
  public readyCallback?: (payload: StageReadyPayload) => void;

  constructor(stageManifest: StageManifest, selectedBackgroundId?: string, selectedCharacterId?: string, selectedObjects?: StageObject[], selectedRoute?: StageRoute, selectedRouteCommands: JuniorCommand[] = []) {
    super({ key: 'JuniorScene' });
    this.stageManifest = stageManifest;
    this.currentObjects = selectedObjects || stageManifest.objects || [];
    this.currentRoute = selectedRoute;
    this.currentRouteCommands = [...selectedRouteCommands];
    this.selectedBackgroundId = selectedBackgroundId || stageManifest.backgrounds[0]?.id || '';
    this.selectedCharacterId = selectedCharacterId || stageManifest.characters[0]?.id || '';
  }

  preload() {
    this.stageManifest.backgrounds.forEach((item) => {
      this.load.image(item.id, item.file);
    });

    this.stageManifest.characters.forEach((item) => {
      this.load.image(item.id, item.file);
    });

    const objectMap = new Map<string, StageObject>();
    this.stageManifest.objects?.forEach((item) => objectMap.set(item.id, item));
    this.stageManifest.levels?.forEach((level) => level.objects?.forEach((item) => objectMap.set(item.id, item)));
    objectMap.forEach((item) => {
      this.load.image(item.id, item.file);
    });

    this.stageManifest.sounds?.forEach((item) => this.load.audio(item.id, item.file));
  }

  create() {
    const { width, height } = this.scale;
    const defaultBg = this.selectedBackgroundId || this.stageManifest.backgrounds[0]?.id;
    const defaultChar = this.selectedCharacterId || this.stageManifest.characters[0]?.id;

    this.bg = this.add.image(width / 2, height / 2, defaultBg);
    this.fitBackgroundToStage();
    this.renderRoute(this.currentRoute);
    this.renderObjects(this.currentObjects);
    this.createActor(defaultChar);

    this.readyCallback?.({ scene: this });
  }

  private renderObjects(objects: StageObject[]) {
    this.clearObjects();

    objects.forEach((item) => {
      if (!this.textures.exists(item.id) || item.locked) return;

      const x = item.position?.x || 0;
      const y = item.position?.y || 0;
      const depth = item.depth ?? this.depthForObject(item);
      const halo = this.createObjectHalo(item, x, y, depth - 0.2);
      const object = this.add.image(x, y, item.id);

      if (item.displaySize) object.setDisplaySize(item.displaySize.width, item.displaySize.height);
      else if (item.scale) object.setScale(item.scale);
      object.setDepth(depth);

      let labelBg: Phaser.GameObjects.Graphics | undefined;
      let label: Phaser.GameObjects.Text | undefined;

      if (item.label) {
        const labelY = item.kind === 'npc'
          ? y + (item.displaySize?.height || 120) / 2 - 30
          : y + (item.displaySize?.height || 120) / 2 + 10;
        const isNpc = item.kind === 'npc';
        const labelColor = isNpc ? 0x10aa55 : 0xffffff;
        const labelStroke = isNpc ? 0x0f7a3b : 0xb7d8fb;

        label = this.add.text(x, labelY, item.label, {
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: isNpc ? '24px' : '22px',
          color: isNpc ? '#ffffff' : '#17345e',
          fontStyle: 'bold',
          align: 'center',
        }).setOrigin(0.5).setDepth(depth + 0.3);

        const labelWidth = label.width + 34;
        const labelHeight = label.height + 16;
        labelBg = this.add.graphics().setDepth(depth + 0.2);
        labelBg.fillStyle(labelColor, 0.96);
        labelBg.fillRoundedRect(x - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, 18);
        labelBg.lineStyle(3, labelStroke, 1);
        labelBg.strokeRoundedRect(x - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, 18);
      }

      this.objectViews.set(item.id, { data: item, image: object, halo, labelBg, label });
    });
  }

  private clearObjects() {
    this.objectViews.forEach((view) => {
      view.halo?.destroy();
      view.labelBg?.destroy();
      view.label?.destroy();
      view.image.destroy();
    });
    this.objectViews.clear();
  }

  private depthForObject(item: StageObject) {
    if (item.kind === 'obstacle') return 3;
    if (item.kind === 'checkpoint' || item.kind === 'target') return 1.4;
    if (item.kind === 'decoration') return 1.1;
    return 2.2;
  }

  private createObjectHalo(item: StageObject, x: number, y: number, depth: number) {
    if (item.showHalo === false || item.kind === 'decoration' || item.kind === 'obstacle' || item.kind === 'npc') return undefined;

    const width = item.displaySize?.width || 120;
    const height = item.displaySize?.height || 120;
    const radiusX = width / 2 + 22;
    const radiusY = Math.max(28, height / 5);
    const color = this.haloColor(item.kind);
    const halo = this.add.graphics();

    halo.fillStyle(color, 0.18);
    halo.fillEllipse(x, y + height * 0.38, radiusX * 2, radiusY * 2);
    halo.lineStyle(5, color, 0.55);
    halo.strokeEllipse(x, y + height * 0.38, radiusX * 2, radiusY * 2);
    halo.setDepth(depth);
    return halo;
  }

  private haloColor(kind?: StageObject['kind']) {
    switch (kind) {
      case 'collectible':
        return 0xffb703;
      case 'target':
        return 0x22c55e;
      case 'checkpoint':
        return 0x38bdf8;
      case 'choice':
        return 0xa855f7;
      case 'reward':
        return 0xfacc15;
      default:
        return 0x38bdf8;
    }
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

  async revealBackground(id: string, message?: string) {
    if (!this.bg || !this.textures.exists(id)) return;

    this.cameras.main.fadeOut(260, 255, 255, 255);
    await this.delay(280);
    this.setBackground(id);
    this.cameras.main.fadeIn(420, 255, 255, 255);
    await this.delay(440);
    this.playSound('success');

    if (message) await this.say(message, 2.6);
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

  setObjects(objects: StageObject[]) {
    this.currentObjects = objects;
    this.renderObjects(this.currentObjects);
  }

  setRoute(route?: StageRoute) {
    this.currentRoute = route;
    this.activeRouteStep = -1;
    this.completedRouteStep = -1;
    if (this.sys.isActive()) this.renderRoute(route);
  }

  setRouteCommands(commands: JuniorCommand[]) {
    this.currentRouteCommands = [...commands];
    this.activeRouteStep = -1;
    this.completedRouteStep = -1;
    if (this.sys.isActive()) this.renderRoute(this.currentRoute);
  }

  private renderRoute(route?: StageRoute) {
    this.routeGraphics?.destroy();
    this.routeHintGraphics?.destroy();
    this.routeMarkers.forEach((marker) => marker.destroy());
    this.routeLabels.forEach((label) => label.destroy());
    this.routeMarkers = [];
    this.routeLabels = [];
    this.routeGraphics = undefined;
    this.routeHintGraphics = undefined;

    if (!route?.points.length) return;

    const footOffset = route.actorFootOffset ?? 142;
    const tileWidth = route.tileSize?.width ?? 160;
    const tileHeight = route.tileSize?.height ?? 92;
    const points = route.points.map((point) => ({ ...point, groundY: point.y + footOffset }));
    const graphics = this.add.graphics().setDepth(0.72);
    const hintGraphics = this.add.graphics().setDepth(1.15);
    this.routeGraphics = graphics;
    this.routeHintGraphics = hintGraphics;

    graphics.lineStyle(Math.max(34, tileHeight * 0.48), 0x17345e, 0.18);
    graphics.beginPath();
    graphics.moveTo(points[0].x + 8, points[0].groundY + 12);
    points.slice(1).forEach((point) => graphics.lineTo(point.x + 8, point.groundY + 12));
    graphics.strokePath();

    graphics.lineStyle(Math.max(23, tileHeight * 0.3), 0xf7ddb0, 0.96);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].groundY);
    points.slice(1).forEach((point) => graphics.lineTo(point.x, point.groundY));
    graphics.strokePath();

    points.slice(1).forEach((point, index) => {
      if (!point.hint) return;
      const placedCommand = this.currentRouteCommands[index + 1];
      if (placedCommand?.type === point.hint) return;
      const previous = points[index];
      const centerX = previous.x + (point.x - previous.x) * 0.5;
      const centerY = previous.groundY + (point.groundY - previous.groundY) * 0.5;
      const baseMarkerSize = points.length <= 9 ? 42 : points.length <= 12 ? 36 : 31;
      const segmentLength = Phaser.Math.Distance.Between(previous.x, previous.groundY, point.x, point.groundY);
      const markerSize = Math.min(baseMarkerSize, Math.max(28, segmentLength * 0.3));
      const markerX = centerX;
      const markerY = centerY - (point.hint === 'jump' ? Math.max(38, tileHeight * 0.58) : 0);
      this.drawRouteHintMarker(hintGraphics, point.hint, markerX, markerY, markerSize, point.hintColor);
    });

    points.forEach((point, index) => {
      const isActive = index === this.activeRouteStep;
      const isCompleted = index <= this.completedRouteStep;
      const command = this.currentRouteCommands[index];
      const fill = isCompleted ? 0xe3f8dc : isActive ? 0xfff0a8 : 0xfff1cf;
      const stroke = isCompleted ? 0x249548 : isActive ? 0xf2b400 : 0xc98938;
      const x = point.x - tileWidth / 2;
      const y = point.groundY - tileHeight / 2;

      if (isActive) {
        graphics.fillStyle(0xffd84d, 0.35);
        graphics.fillRoundedRect(x - 13, y - 13, tileWidth + 26, tileHeight + 26, 22);
      }
      graphics.fillStyle(0x17345e, 0.24);
      graphics.fillRoundedRect(x + 9, y + 12, tileWidth, tileHeight, 16);
      graphics.fillStyle(fill, 1);
      graphics.fillRoundedRect(x, y, tileWidth, tileHeight, 16);
      graphics.lineStyle(5, stroke, 1);
      graphics.strokeRoundedRect(x, y, tileWidth, tileHeight, 16);
      graphics.lineStyle(4, 0xffffff, 0.62);
      graphics.beginPath();
      graphics.moveTo(x + 15, y + 10);
      graphics.lineTo(x + tileWidth - 15, y + 10);
      graphics.strokePath();

      if (command) {
        const commandColor = this.commandColor(command.color);
        const insetX = Math.max(13, tileWidth * 0.1);
        const insetY = Math.max(10, tileHeight * 0.12);
        graphics.fillStyle(commandColor, 0.22);
        graphics.fillRoundedRect(x + insetX + 4, y + insetY + 6, tileWidth - insetX * 2, tileHeight - insetY * 2, 12);
        graphics.fillStyle(commandColor, 1);
        graphics.fillRoundedRect(x + insetX, y + insetY, tileWidth - insetX * 2, tileHeight - insetY * 2, 12);
        this.drawRouteCommandGlyph(graphics, command, point.x, point.groundY, Math.min(tileWidth, tileHeight) * 0.46);
      } else if (index === 0 && point.hint === 'start') {
        const hintWidth = tileWidth * 0.56;
        const hintHeight = tileHeight * 0.62;
        hintGraphics.fillStyle(0xffd84d, 0.32);
        hintGraphics.fillRoundedRect(point.x - hintWidth / 2, point.groundY - hintHeight / 2, hintWidth, hintHeight, 12);
        this.drawRouteCommandGlyph(hintGraphics, { type: 'start' }, point.x, point.groundY, Math.min(tileWidth, tileHeight) * 0.42, 0.58);
      }

      this.createRouteStepNumber(point.x - tileWidth / 2 + 10, point.groundY - tileHeight / 2 + 7, index + 1, isCompleted);
    });

    const startLabelX = Math.max(105, points[0].x - tileWidth * 1.05);
    this.createRouteLabel(startLabelX, points[0].groundY - 8, route.startLabel || 'START', 0xffd44d, 0x9a5b0c);
    const goal = points[points.length - 1];
    this.createRouteLabel(goal.x, goal.groundY - 78, route.goalLabel || 'MASJID', 0x22c55e, 0x116d35);
  }

  private commandColor(value: string) {
    try {
      return Phaser.Display.Color.HexStringToColor(value).color;
    } catch {
      return 0x168eea;
    }
  }

  private createRouteStepNumber(x: number, y: number, value: number, completed: boolean) {
    const marker = this.add.graphics().setDepth(3.5);
    marker.fillStyle(0x17345e, 0.2);
    marker.fillCircle(x + 3, y + 4, 22);
    marker.fillStyle(completed ? 0x249548 : 0x9f5a17, 1);
    marker.fillCircle(x, y, 21);
    marker.lineStyle(3, completed ? 0xd8f5d5 : 0xffe3a4, 1);
    marker.strokeCircle(x, y, 21);
    this.routeMarkers.push(marker);

    const label = this.add.text(x, y, completed ? '✓' : `${value}`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '23px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(3.6);
    this.routeLabels.push(label);
  }

  private drawRouteHintMarker(graphics: Phaser.GameObjects.Graphics, type: StageRoute['points'][number]['hint'], x: number, y: number, size: number, hintColor?: string) {
    if (!type || type === 'start') return;
    if (type === 'jump') {
      const width = size * 1.28;
      const height = size * 0.82;
      graphics.fillStyle(0x17345e, 0.24);
      graphics.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 6, width, height, 10);
      graphics.fillStyle(0xffffff, 0.98);
      graphics.fillRoundedRect(x - width / 2 - 4, y - height / 2 - 4, width + 8, height + 8, 12);
      graphics.fillStyle(0xff9f18, 1);
      graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 9);
      graphics.lineStyle(2, 0xa6550a, 1);
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 9);
      this.drawRouteCommandGlyph(graphics, { type }, x, y - 1, size * 0.65);
      return;
    }

    const actionColors: Partial<Record<JuniorCommand['type'], number>> = {
      pick: 0xf97316,
      drop: 0x14b8a6,
      choice: 0x8b5cf6,
      say: 0xb865dd,
      sound: 0x27c488,
      recordVoice: 0xf0528d,
      wait: 0xff7d8a,
    };
    const actionColor = hintColor ? this.commandColor(hintColor) : actionColors[type];
    if (actionColor !== undefined) {
      const plateSize = size * 1.08;
      graphics.fillStyle(0x17345e, 0.24);
      graphics.fillRoundedRect(x - plateSize / 2 + 4, y - plateSize / 2 + 6, plateSize, plateSize, 12);
      graphics.fillStyle(0xffffff, 0.98);
      graphics.fillRoundedRect(x - plateSize / 2 - 4, y - plateSize / 2 - 4, plateSize + 8, plateSize + 8, 14);
      graphics.fillStyle(actionColor, 1);
      graphics.fillRoundedRect(x - plateSize / 2, y - plateSize / 2, plateSize, plateSize, 11);
      graphics.lineStyle(2, 0x17345e, 0.65);
      graphics.strokeRoundedRect(x - plateSize / 2, y - plateSize / 2, plateSize, plateSize, 11);
      this.drawRouteCommandGlyph(graphics, { type }, x, y, size * 0.68);
      return;
    }

    const angleByType: Partial<Record<JuniorCommand['type'], number>> = {
      moveRight: 0,
      moveLeft: Math.PI,
      moveUp: -Math.PI / 2,
      moveDown: Math.PI / 2,
    };
    const angle = angleByType[type];
    if (angle === undefined) return;
    const template = [
      [-0.62, -0.18],
      [0.12, -0.18],
      [0.12, -0.46],
      [0.66, 0],
      [0.12, 0.46],
      [0.12, 0.18],
      [-0.62, 0.18],
    ];
    const makePoints = (scale: number, offsetX = 0, offsetY = 0) => template.map(([unitX, unitY]) => {
      const localX = unitX * size * scale;
      const localY = unitY * size * scale;
      return new Phaser.Math.Vector2(
        x + offsetX + localX * Math.cos(angle) - localY * Math.sin(angle),
        y + offsetY + localX * Math.sin(angle) + localY * Math.cos(angle),
      );
    });

    graphics.fillStyle(0x17345e, 0.28);
    graphics.fillPoints(makePoints(1.18, 4, 5), true);
    graphics.fillStyle(0xffffff, 0.98);
    graphics.fillPoints(makePoints(1.18), true);
    graphics.fillStyle(0x168eea, 1);
    graphics.fillPoints(makePoints(1), true);
    graphics.lineStyle(2, 0x0759a6, 1);
    graphics.strokePoints(makePoints(1), true);
  }

  private drawRouteCommandGlyph(graphics: Phaser.GameObjects.Graphics, command: Pick<JuniorCommand, 'type'>, x: number, y: number, size: number, alpha = 1) {
    const ink = 0x102a56;
    const white = 0xffffff;
    const half = size / 2;
    graphics.lineStyle(Math.max(5, size * 0.13), ink, alpha);

    if (command.type === 'start') {
      graphics.lineBetween(x - half * 0.55, y - half * 0.7, x - half * 0.55, y + half * 0.72);
      graphics.fillStyle(0xff3f62, alpha);
      graphics.fillTriangle(x - half * 0.48, y - half * 0.66, x + half * 0.68, y - half * 0.42, x - half * 0.48, y - half * 0.02);
      graphics.lineStyle(Math.max(3, size * 0.07), ink, alpha);
      graphics.strokeTriangle(x - half * 0.48, y - half * 0.66, x + half * 0.68, y - half * 0.42, x - half * 0.48, y - half * 0.02);
      graphics.lineBetween(x - half * 0.88, y + half * 0.72, x - half * 0.2, y + half * 0.72);
      return;
    }

    const directions: Partial<Record<JuniorCommand['type'], { dx: number; dy: number }>> = {
      moveRight: { dx: 1, dy: 0 },
      moveLeft: { dx: -1, dy: 0 },
      moveUp: { dx: 0, dy: -1 },
      moveDown: { dx: 0, dy: 1 },
    };
    const direction = directions[command.type];
    if (direction) {
      const startX = x - direction.dx * half * 0.65;
      const startY = y - direction.dy * half * 0.65;
      const tipX = x + direction.dx * half * 0.72;
      const tipY = y + direction.dy * half * 0.72;
      const perpendicularX = -direction.dy;
      const perpendicularY = direction.dx;
      const baseX = x + direction.dx * half * 0.18;
      const baseY = y + direction.dy * half * 0.18;
      graphics.lineBetween(startX, startY, baseX, baseY);
      graphics.fillStyle(white, alpha);
      graphics.fillTriangle(
        tipX,
        tipY,
        baseX + perpendicularX * half * 0.48,
        baseY + perpendicularY * half * 0.48,
        baseX - perpendicularX * half * 0.48,
        baseY - perpendicularY * half * 0.48,
      );
      graphics.lineStyle(Math.max(3, size * 0.07), ink, alpha);
      graphics.strokeTriangle(
        tipX,
        tipY,
        baseX + perpendicularX * half * 0.48,
        baseY + perpendicularY * half * 0.48,
        baseX - perpendicularX * half * 0.48,
        baseY - perpendicularY * half * 0.48,
      );
      return;
    }

    if (command.type === 'jump') {
      graphics.lineStyle(Math.max(5, size * 0.11), ink, alpha);
      graphics.beginPath();
      graphics.arc(x, y + half * 0.55, half * 0.72, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335), false);
      graphics.strokePath();
      graphics.fillStyle(white, alpha);
      graphics.fillTriangle(x + half * 0.72, y + half * 0.2, x + half * 0.28, y + half * 0.08, x + half * 0.5, y + half * 0.58);
      graphics.fillCircle(x - half * 0.58, y + half * 0.55, Math.max(4, size * 0.09));
      return;
    }

    if (command.type === 'pick' || command.type === 'drop') {
      const arrowDirection = command.type === 'pick' ? 1 : -1;
      const trayY = y + half * 0.5;
      graphics.lineStyle(Math.max(3, size * 0.08), ink, alpha);
      graphics.strokeRoundedRect(x - half * 0.62, trayY - half * 0.18, half * 1.24, half * 0.38, half * 0.12);
      graphics.lineBetween(x, y + arrowDirection * half * 0.5, x, y - arrowDirection * half * 0.2);
      graphics.fillStyle(white, alpha);
      graphics.fillTriangle(
        x,
        y - arrowDirection * half * 0.55,
        x - half * 0.34,
        y - arrowDirection * half * 0.12,
        x + half * 0.34,
        y - arrowDirection * half * 0.12,
      );
      return;
    }

    if (command.type === 'choice') {
      graphics.lineStyle(Math.max(4, size * 0.1), ink, alpha);
      graphics.lineBetween(x - half * 0.68, y, x - half * 0.08, y);
      graphics.lineBetween(x - half * 0.08, y, x + half * 0.42, y - half * 0.48);
      graphics.lineBetween(x - half * 0.08, y, x + half * 0.42, y + half * 0.48);
      graphics.fillStyle(white, alpha);
      graphics.fillCircle(x - half * 0.68, y, half * 0.17);
      graphics.fillCircle(x + half * 0.5, y - half * 0.54, half * 0.2);
      graphics.fillCircle(x + half * 0.5, y + half * 0.54, half * 0.2);
      return;
    }

    if (command.type === 'say') {
      graphics.fillStyle(white, alpha);
      graphics.fillRoundedRect(x - half * 0.72, y - half * 0.56, half * 1.44, half * 0.96, half * 0.18);
      graphics.fillTriangle(x - half * 0.32, y + half * 0.34, x - half * 0.62, y + half * 0.78, x + half * 0.02, y + half * 0.34);
      graphics.fillStyle(ink, alpha);
      [-0.36, 0, 0.36].forEach((offset) => graphics.fillCircle(x + half * offset, y - half * 0.08, half * 0.1));
      return;
    }

    if (command.type === 'sound') {
      graphics.fillStyle(white, alpha);
      graphics.fillRect(x - half * 0.7, y - half * 0.24, half * 0.34, half * 0.48);
      graphics.fillTriangle(x - half * 0.36, y - half * 0.24, x + half * 0.04, y - half * 0.62, x + half * 0.04, y + half * 0.62);
      graphics.lineStyle(Math.max(3, size * 0.08), white, alpha);
      graphics.beginPath();
      graphics.arc(x + half * 0.02, y, half * 0.48, -0.72, 0.72, false);
      graphics.strokePath();
      graphics.beginPath();
      graphics.arc(x + half * 0.02, y, half * 0.78, -0.68, 0.68, false);
      graphics.strokePath();
      return;
    }

    if (command.type === 'recordVoice') {
      graphics.lineStyle(Math.max(4, size * 0.09), ink, alpha);
      graphics.strokeRoundedRect(x - half * 0.25, y - half * 0.72, half * 0.5, half * 0.9, half * 0.25);
      graphics.beginPath();
      graphics.arc(x, y - half * 0.04, half * 0.54, 0, Math.PI, false);
      graphics.strokePath();
      graphics.lineBetween(x, y + half * 0.5, x, y + half * 0.72);
      graphics.lineBetween(x - half * 0.35, y + half * 0.72, x + half * 0.35, y + half * 0.72);
      return;
    }

    if (command.type === 'wait') {
      graphics.lineStyle(Math.max(4, size * 0.09), ink, alpha);
      graphics.lineBetween(x - half * 0.48, y - half * 0.68, x + half * 0.48, y - half * 0.68);
      graphics.lineBetween(x - half * 0.48, y + half * 0.68, x + half * 0.48, y + half * 0.68);
      graphics.lineBetween(x - half * 0.36, y - half * 0.6, x + half * 0.36, y + half * 0.6);
      graphics.lineBetween(x + half * 0.36, y - half * 0.6, x - half * 0.36, y + half * 0.6);
      graphics.fillStyle(white, alpha);
      graphics.fillTriangle(x - half * 0.28, y - half * 0.5, x + half * 0.28, y - half * 0.5, x, y - half * 0.08);
      graphics.fillTriangle(x - half * 0.3, y + half * 0.5, x + half * 0.3, y + half * 0.5, x, y + half * 0.12);
    }
  }

  private createRouteLabel(x: number, y: number, value: string, background: number, stroke: number) {
    const label = this.add.text(x, y, value, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: `#${stroke.toString(16).padStart(6, '0')}`,
      strokeThickness: 7,
      padding: { x: 18, y: 10 },
      backgroundColor: `#${background.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(3.4);
    this.routeLabels.push(label);
  }

  async moveBy(dx: number, dy: number) {
    if (!this.actor) return;
    const { width, height } = this.scale;
    const nextX = Phaser.Math.Clamp(this.actor.x + dx, 54, width - 54);
    const nextY = Phaser.Math.Clamp(this.actor.y + dy, 60, height - 54);
    const tweens: Promise<void>[] = [
      this.tweenPromise({ targets: this.actor, x: nextX, y: nextY, duration: 520, ease: 'Sine.easeInOut' }),
    ];

    if (this.carriedBadge) {
      tweens.push(this.tweenPromise({
        targets: this.carriedBadge,
        x: nextX,
        y: this.carriedBadgeY(nextY),
        duration: 520,
        ease: 'Sine.easeInOut',
      }));
    }

    await Promise.all(tweens);
  }

  hasRouteStep(index: number) {
    return !!this.currentRoute?.points[index];
  }

  beginRouteStep(index: number) {
    if (!this.hasRouteStep(index)) return;
    this.activeRouteStep = index;
    this.renderRoute(this.currentRoute);
  }

  completeRouteStep(index: number) {
    if (!this.hasRouteStep(index)) return;
    this.completedRouteStep = Math.max(this.completedRouteStep, index);
    this.activeRouteStep = -1;
    this.renderRoute(this.currentRoute);
  }

  async moveToRouteStep(index: number) {
    if (!this.actor) return;
    const point = this.currentRoute?.points[index];
    if (!point) return;
    const target = point.actorPosition || point;
    const distance = Phaser.Math.Distance.Between(this.actor.x, this.actor.y, target.x, target.y);
    const duration = Phaser.Math.Clamp(distance * 2.15, 380, 720);
    await this.tweenPromise({ targets: this.actor, x: target.x, y: target.y, duration, ease: 'Sine.easeInOut' });
    this.syncCarriedBadge();
  }

  async jumpToRouteStep(index: number, height: number) {
    if (!this.actor) return;
    const point = this.currentRoute?.points[index];
    if (!point) return;
    const target = point.actorPosition || point;

    const originalDepth = this.actor.depth;
    const startX = this.actor.x;
    const startY = this.actor.y;
    const peakY = Math.min(startY, target.y) - Math.max(105, height);
    this.actor.setDepth(4.2);
    await this.tweenPromise({
      targets: this.actor,
      x: Phaser.Math.Linear(startX, target.x, 0.5),
      y: peakY,
      duration: 310,
      ease: 'Sine.easeOut',
    });
    await this.tweenPromise({
      targets: this.actor,
      x: target.x,
      y: target.y,
      duration: 360,
      ease: 'Bounce.easeOut',
    });
    this.actor.setDepth(originalDepth);
    this.syncCarriedBadge();
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
    this.syncCarriedBadge();
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

  async playVoiceRecording(recordingUrl: string | undefined, targetText: string, seconds = 3) {
    if (!recordingUrl) {
      await this.say('Rekaman belum ada.\nPasang ulang blok rekam suara.', 2);
      return;
    }

    this.showVoicePlaybackBubble(targetText.trim() || 'Suara anak');

    try {
      const audio = new Audio(recordingUrl);
      const ended = new Promise<void>((resolve) => {
        audio.addEventListener('ended', () => resolve(), { once: true });
        audio.addEventListener('error', () => resolve(), { once: true });
      });

      await audio.play();
      await Promise.race([ended, this.delay((seconds + 1) * 1000)]);
    } catch {
      await this.say('Suara belum bisa diputar.', 1.5);
    } finally {
      this.hideBubble();
    }
  }

  playSound(id: string) {
    if (!this.cache.audio.exists(id)) return;
    this.sound.play(id, { volume: 0.55 });
  }

  async pickObject(objectId?: string) {
    if (!this.actor) return false;
    if (this.carriedObjectId) {
      await this.say('Taruh dulu barangnya.', 1.5);
      return false;
    }

    const view = objectId ? this.objectViews.get(objectId) : this.findNearestCollectible();
    if (!view || !view.image.visible) {
      await this.say('Barangnya belum ada.', 1.5);
      return false;
    }

    if (!this.isObjectInReach(view)) {
      await this.pulseObject(view);
      await this.say(`Dekati ${view.data.name} dulu.`, 1.6);
      return false;
    }

    this.playSound('pop');
    await this.pulseObject(view);
    view.image.setVisible(false);
    view.halo?.setVisible(false);
    view.labelBg?.setVisible(false);
    view.label?.setVisible(false);
    this.carriedObjectId = view.data.id;
    this.showCarriedBadge(view.data);

    if (view.data.pickupText) await this.say(view.data.pickupText, 1.2);
    return true;
  }

  async dropObject(targetId?: string) {
    if (!this.actor) return false;
    if (!this.carriedObjectId) {
      await this.say('Ambil barang dulu.', 1.5);
      return false;
    }

    const carriedView = this.objectViews.get(this.carriedObjectId);
    const target = this.findDropTarget(targetId, carriedView?.data);

    if (!target) {
      await this.say('Tempat taruh belum ada.', 1.5);
      return false;
    }

    if (!this.isObjectInReach(target)) {
      await this.pulseObject(target);
      await this.say(`Dekati ${target.data.name} dulu.`, 1.6);
      return false;
    }

    this.playSound('success');
    await this.animateDropToTarget(this.carriedObjectId, target);
    this.destroyCarriedBadge();
    this.carriedObjectId = undefined;
    await this.pulseObject(target);

    if (target.data.dropText || target.data.successText) {
      await this.say(target.data.dropText || target.data.successText || 'Bagus!', 1.4);
    }

    return true;
  }

  async chooseOption(choiceId: string, text: string) {
    const view = this.objectViews.get(choiceId);

    if (!view) {
      await this.say(text, 1.6);
      return true;
    }

    if (!this.isObjectInReach(view)) {
      await this.pulseObject(view);
      await this.say(`Dekati ${view.data.name} dulu.`, 1.6);
      return false;
    }

    await this.pulseObject(view);
    if (view.data.correct === false) {
      await this.say('Coba pilih yang baik.', 1.5);
      return false;
    }

    await this.say(view.data.choiceText || text, 1.6);
    this.playSound('success');
    return true;
  }

  async showRepeatCue(times: number, label: string) {
    this.hideBubble();

    const bubbleWidth = 420;
    const bubbleHeight = 116;
    const bubbleX = this.scale.width / 2;
    const bubbleY = Math.max(96, this.scale.height * 0.14);
    const bubbleGraphics = this.add.graphics();
    bubbleGraphics.fillStyle(0x17345e, 0.18);
    bubbleGraphics.fillRoundedRect(-bubbleWidth / 2 + 8, -bubbleHeight / 2 + 10, bubbleWidth, bubbleHeight, 28);
    bubbleGraphics.fillStyle(0xffffff, 0.98);
    bubbleGraphics.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 28);
    bubbleGraphics.lineStyle(8, 0x7c5cff, 1);
    bubbleGraphics.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 28);

    const bubbleText = this.add.text(0, 0, `${label}\n${times} kali`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '32px',
      color: '#12305f',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 5,
    }).setOrigin(0.5);

    this.bubble = this.add.container(bubbleX, bubbleY, [bubbleGraphics, bubbleText])
      .setDepth(9)
      .setAlpha(0)
      .setScale(0.9);

    this.tweens.add({ targets: this.bubble, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
    await this.delay(650);
    this.hideBubble();
  }

  showMissionComplete(reward?: StageReward) {
    this.playSound('success');
    this.emitConfetti();

    if (!reward?.badgeTitle && !reward?.unlockTitle) return;

    const message = [reward.badgeTitle, reward.unlockTitle ? `Misi berikutnya: ${reward.unlockTitle}` : '']
      .filter(Boolean)
      .join('\n');
    void this.say(message || 'Misi selesai!', 2);
  }

  resetActor() {
    if (!this.actor) return;
    const { width, height } = this.scale;
    const x = this.selectedCharacter?.startPosition?.x ?? width / 2;
    const y = this.selectedCharacter?.startPosition?.y ?? height * 0.68;
    this.actor.setPosition(x, y);
    this.actor.setAngle(0);
    this.syncCarriedBadge();
  }

  resetRunState() {
    this.hideBubble();
    this.destroyCarriedBadge();
    this.carriedObjectId = undefined;
    this.renderObjects(this.currentObjects);
    this.activeRouteStep = -1;
    this.completedRouteStep = -1;
    this.renderRoute(this.currentRoute);
    this.resetActor();
  }

  private findNearestCollectible() {
    if (!this.actor) return undefined;

    return [...this.objectViews.values()]
      .filter((view) => view.data.kind === 'collectible' && view.image.visible)
      .sort((a, b) => this.distanceToActor(a) - this.distanceToActor(b))[0];
  }

  private findDropTarget(targetId?: string, carried?: StageObject) {
    if (targetId) return this.objectViews.get(targetId);
    if (carried?.targetId) return this.objectViews.get(carried.targetId);

    return [...this.objectViews.values()]
      .filter((view) => view.data.kind === 'target' || view.data.kind === 'checkpoint')
      .sort((a, b) => this.distanceToActor(a) - this.distanceToActor(b))[0];
  }

  private isObjectInReach(view: RenderedStageObject) {
    return this.distanceToActor(view) <= (view.data.interactionRadius || 190);
  }

  private distanceToActor(view: RenderedStageObject) {
    if (!this.actor) return Number.POSITIVE_INFINITY;
    return Phaser.Math.Distance.Between(this.actor.x, this.actor.y, view.image.x, view.image.y);
  }

  private async pulseObject(view: RenderedStageObject) {
    const scaleX = view.image.scaleX;
    const scaleY = view.image.scaleY;
    await this.tweenPromise({
      targets: view.image,
      scaleX: scaleX * 1.12,
      scaleY: scaleY * 1.12,
      duration: 130,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
  }

  private showCarriedBadge(object: StageObject) {
    if (!this.actor || !this.textures.exists(object.id)) return;
    this.destroyCarriedBadge();

    const circle = this.add.graphics();
    circle.fillStyle(0xffffff, 0.96);
    circle.fillCircle(0, 0, 54);
    circle.lineStyle(6, 0xffd45c, 1);
    circle.strokeCircle(0, 0, 54);

    const image = this.add.image(0, -2, object.id).setDisplaySize(76, 76);
    this.carriedBadge = this.add.container(this.actor.x, this.carriedBadgeY(this.actor.y), [circle, image])
      .setDepth(7)
      .setScale(0.1);
    this.tweens.add({ targets: this.carriedBadge, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  private destroyCarriedBadge() {
    this.carriedBadge?.destroy(true);
    this.carriedBadge = undefined;
  }

  private syncCarriedBadge() {
    if (!this.actor || !this.carriedBadge) return;
    this.carriedBadge.setPosition(this.actor.x, this.carriedBadgeY(this.actor.y));
  }

  private carriedBadgeY(actorY: number) {
    const actorHeight = this.actor?.displayHeight || 180;
    return actorY - actorHeight * 0.6;
  }

  private async animateDropToTarget(objectId: string, target: RenderedStageObject) {
    if (!this.actor || !this.textures.exists(objectId)) return;

    const dropImage = this.add.image(this.actor.x, this.carriedBadgeY(this.actor.y), objectId)
      .setDisplaySize(86, 86)
      .setDepth(7);

    await this.tweenPromise({
      targets: dropImage,
      x: target.image.x,
      y: target.image.y - 16,
      scaleX: 0.58,
      scaleY: 0.58,
      duration: 420,
      ease: 'Sine.easeInOut',
    });
    dropImage.destroy();
  }

  private emitConfetti() {
    const colors = [0xff5d8f, 0xffd45c, 0x22c55e, 0x38bdf8, 0x7c5cff];
    const originX = this.actor?.x ?? this.scale.width / 2;
    const originY = (this.actor?.y ?? this.scale.height / 2) - 140;

    for (let index = 0; index < 28; index += 1) {
      const piece = this.add.graphics();
      piece.fillStyle(colors[index % colors.length], 1);
      piece.fillRoundedRect(-8, -8, 16, 16, 4);
      piece.setPosition(originX, originY);
      piece.setDepth(10);

      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.95, -Math.PI * 0.05);
      const distance = Phaser.Math.Between(160, 420);
      this.tweens.add({
        targets: piece,
        x: originX + Math.cos(angle) * distance,
        y: originY + Math.sin(angle) * distance + Phaser.Math.Between(60, 220),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1300),
        ease: 'Cubic.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }

  private hideBubble() {
    this.bubble?.destroy(true);
    this.bubble = undefined;
  }

  private showVoicePlaybackBubble(targetText: string) {
    this.hideBubble();

    const bubbleWidth = 640;
    const bubbleHeight = 190;
    const bubbleX = this.scale.width / 2;
    const bubbleY = Math.max(150, this.scale.height * 0.2);
    const bubbleGraphics = this.add.graphics();

    bubbleGraphics.fillStyle(0x17345e, 0.2);
    bubbleGraphics.fillRoundedRect(-bubbleWidth / 2 + 8, -bubbleHeight / 2 + 10, bubbleWidth, bubbleHeight, 30);
    bubbleGraphics.fillStyle(0xffffff, 0.98);
    bubbleGraphics.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 30);
    bubbleGraphics.lineStyle(8, 0xff5d8f, 1);
    bubbleGraphics.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 30);
    bubbleGraphics.fillStyle(0xff5d8f, 0.18);
    bubbleGraphics.fillCircle(-bubbleWidth / 2 + 86, 0, 50);
    bubbleGraphics.fillStyle(0xff5d8f, 1);
    bubbleGraphics.fillCircle(-bubbleWidth / 2 + 86, 0, 26);

    const bubbleText = this.add.text(-bubbleWidth / 2 + 160, -42, `Memutar suara...\n"${targetText}"`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '34px',
      color: '#12305f',
      fontStyle: 'bold',
      lineSpacing: 7,
      wordWrap: { width: 420, useAdvancedWrap: true },
    });

    const micStem = this.add.graphics();
    micStem.lineStyle(8, 0xffffff, 1);
    micStem.strokeRoundedRect(-bubbleWidth / 2 + 74, -25, 24, 42, 12);
    micStem.beginPath();
    micStem.moveTo(-bubbleWidth / 2 + 64, 0);
    micStem.lineTo(-bubbleWidth / 2 + 64, 4);
    micStem.arc(-bubbleWidth / 2 + 86, 4, 22, Math.PI, 0, true);
    micStem.lineTo(-bubbleWidth / 2 + 108, 0);
    micStem.strokePath();
    micStem.lineBetween(-bubbleWidth / 2 + 86, 26, -bubbleWidth / 2 + 86, 42);
    micStem.lineBetween(-bubbleWidth / 2 + 70, 42, -bubbleWidth / 2 + 102, 42);

    this.bubble = this.add.container(bubbleX, bubbleY, [bubbleGraphics, micStem, bubbleText])
      .setDepth(9)
      .setAlpha(0)
      .setScale(0.9);
    this.tweens.add({ targets: this.bubble, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
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

export function createGame(parent: HTMLDivElement, stageManifest: StageManifest, onReady: (scene: JuniorScene) => void, selectedBackgroundId?: string, selectedCharacterId?: string, selectedObjects?: StageObject[], selectedRoute?: StageRoute, selectedRouteCommands: JuniorCommand[] = []) {
  const scene = new JuniorScene(stageManifest, selectedBackgroundId, selectedCharacterId, selectedObjects, selectedRoute, selectedRouteCommands);
  scene.readyCallback = ({ scene }) => onReady(scene);
  const virtualWidth = stageManifest.stageSize?.width || 1280;
  const virtualHeight = stageManifest.stageSize?.height || 720;
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: virtualWidth,
    height: virtualHeight,
    backgroundColor: '#dff6ff',
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  });
}
