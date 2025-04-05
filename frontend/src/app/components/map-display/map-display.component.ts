import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { Application, Container, Point, Graphics, Rectangle } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

@Component({
  selector: 'app-map-display',
  templateUrl: './map-display.component.html',
  styleUrls: ['./map-display.component.scss'],
  standalone: false
})
export class MapDisplayComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() height: number = 100; // Hauteur par défaut en pixels
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
  @ViewChild('minimap', { static: true }) minimapElement!: ElementRef<HTMLDivElement>;
  
  // Propriétés publiques
  public selectedPixel: { x: number; y: number } | null = null;
  public isModalOpen: boolean = false;
  public isInit = false;
  
  // Propriétés privées
  private app: Application | null = null;
  private minimapApp: Application | null = null;
  private viewport: Viewport | null = null;
  private layer: Container | null = null;
  private minimapViewport: HTMLElement | null = null;
  private currentScale = 1;
  private resizeObserver: ResizeObserver | null = null;
  private selectedTile: Graphics | null = null;
  private tileColors: Map<string, number> = new Map();
  private resizeTimeout: any = null;

  // Constants
  private readonly BASE_PIXEL_SIZE = 32;
  private readonly WIDTH = 100;
  private readonly HEIGHT = 100;
  private readonly MIN_SCALE = 0.05;
  private readonly MAX_SCALE = 20;
  private readonly ZOOM_STEP = 0.2;
  private readonly SELECTION_COLOR = 0x00ff00; // Couleur verte pour la sélection
  private readonly HOVER_COLOR = 0x666666; // Couleur grise pour le survol
  private readonly MINIMAP_SIZE = 150;
  private readonly isDesktop = !('ontouchstart' in window);

  constructor() {}

  ngOnInit() {
    this.initApp();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  ngAfterViewInit() {
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
      this.setupResizeObserver();
      this.handleResize();
      
      // Forcer un redimensionnement après un court délai pour s'assurer que les dimensions sont correctes
      setTimeout(() => {
        this.handleResize();
      }, 100);
    }, 0);
  }

  /**
   * Initialise l'application PIXI et configure le viewport
   */
  private async initApp() {
    if (!this.container.nativeElement || this.app) return;

    // Initialiser l'affichage principal
    await this.initMainDisplay();
    
    // Initialiser la minimap
    await this.initMinimap();
    
    // Configurer le viewport
    this.setupViewport();
    
    // Créer et configurer le layer
    this.setupLayer();
    
    // Configurer les interactions
    this.setupInteractions();
    
    // Configurer la minimap
    this.setupMinimapViewport();
    
    // Démarrer le ticker
    const app = (this.app as unknown) as Application;
    if (app) {
      app.ticker.minFPS = 0;
      app.ticker.add(this.updateMinimapViewport.bind(this));
      app.ticker.start();
    }
    
    // Marquer comme initialisé
    this.isInit = true;
    
    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Initialise l'affichage principal
   */
  private async initMainDisplay() {
    this.app = new Application();
    await this.app.init({
      backgroundAlpha: 1,
      resizeTo: this.container.nativeElement,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
      backgroundColor: 0xffffff,
      eventMode: 'static',
      eventFeatures: {
        move: true,
        globalMove: true,
        click: true,
        wheel: true
      }
    });

    this.container.nativeElement.appendChild(this.app.canvas);
  }

  /**
   * Initialise la minimap
   */
  private async initMinimap() {
    this.minimapApp = new Application();
    await this.minimapApp.init({
      width: this.MINIMAP_SIZE,
      height: this.MINIMAP_SIZE,
      backgroundAlpha: 1,
      resolution: 1,
      antialias: true,
      backgroundColor: 0x2c2e31,
    });

    this.minimapElement.nativeElement.appendChild(this.minimapApp.canvas);
  }

  /**
   * Configure le viewport
   */
  private setupViewport() {
    if (!this.app || !this.container.nativeElement) return;

    const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
    const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;

    // Créer le viewport
    this.viewport = new Viewport({
      screenWidth: this.container.nativeElement.clientWidth,
      screenHeight: this.container.nativeElement.clientHeight,
      worldWidth,
      worldHeight,
      events: this.app.renderer.events,
      disableOnContextMenu: true,
      stopPropagation: true,
      noTicker: true,
      ticker: this.app.ticker
    });

    // Configurer les propriétés du viewport
    this.viewport.eventMode = "static";
    this.viewport.sortableChildren = true;
    this.viewport.interactive = true;
    this.viewport.cursor = 'grab';
    this.viewport.hitArea = new Rectangle(0, 0, this.container.nativeElement.clientWidth, this.container.nativeElement.clientHeight);

    // Configurer le zoom et les interactions
    this.viewport
      .drag({
        mouseButtons: 'all',
        pressDrag: true
      });

    // Configurer le zoom en fonction de la plateforme
    if (this.isDesktop) {
      // Sur desktop, utiliser uniquement la molette de la souris
      this.viewport
        .wheel({
          percent: 0.1,
          smooth: 5
        });
    } else {
      // Sur mobile, utiliser le pinch to zoom
      this.viewport
        .pinch({
          percent: 2,
          factor: 2
        })
        .wheel({
          percent: 0.1,
          smooth: 5
        });
    }

    this.viewport
      .decelerate({
        friction: 0.95,
        bounce: 0.8,
        minSpeed: 0.01
      })
      .clampZoom({
        minScale: this.MIN_SCALE,
        maxScale: this.MAX_SCALE
      });

    // Configurer les gestionnaires d'événements pour le curseur
    this.setupCursorHandlers();

    // Désactiver le zoom natif du navigateur sur mobile
    this.disableNativeZoom();

    // Gestionnaires d'événements pour le zoom
    this.viewport.on('zoomed', ({ viewport }) => {
      this.currentScale = viewport.scale.x;
      this.updateMinimapViewport();
    });

    // Ajouter le viewport au stage
    this.app.stage.addChild(this.viewport);

    // Centrer le viewport
    this.centerViewport();
  }

  /**
   * Configure les gestionnaires d'événements pour le curseur
   */
  private setupCursorHandlers() {
    if (!this.viewport) return;

    this.viewport.on('pointerdown', () => {
      if (this.viewport) {
        this.viewport.cursor = 'grabbing';
      }
    });

    this.viewport.on('pointerup', () => {
      if (this.viewport) {
        this.viewport.cursor = 'grab';
      }
    });

    this.viewport.on('pointerupoutside', () => {
      if (this.viewport) {
        this.viewport.cursor = 'grab';
      }
    });
  }

  /**
   * Désactive le zoom natif du navigateur sur mobile
   */
  private disableNativeZoom() {
    if (!this.container.nativeElement) return;

    this.container.nativeElement.addEventListener('gesturestart', (e) => e.preventDefault());
    this.container.nativeElement.addEventListener('gesturechange', (e) => e.preventDefault());
    this.container.nativeElement.addEventListener('gestureend', (e) => e.preventDefault());
  }

  /**
   * Centre le viewport
   */
  private centerViewport() {
    if (!this.viewport || !this.container.nativeElement) return;

    const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
    const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;

    // Calculer l'échelle initiale
    const widthScale = this.container.nativeElement.clientWidth / worldWidth;
    const heightScale = this.container.nativeElement.clientHeight / worldHeight;
    this.currentScale = Math.min(widthScale, heightScale) * 0.8;
    this.viewport.scale.set(this.currentScale);

    // Centrer le viewport
    this.viewport.x = (this.container.nativeElement.clientWidth - worldWidth * this.currentScale) / 2;
    this.viewport.y = (this.container.nativeElement.clientHeight - worldHeight * this.currentScale) / 2;
  }

  /**
   * Configure le layer
   */
  private setupLayer() {
    if (!this.viewport) return;

    const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
    const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;

    // Créer le layer
    this.layer = new Container();
    this.layer.eventMode = 'none';
    this.layer.sortableChildren = true;
    this.layer.width = worldWidth;
    this.layer.height = worldHeight;
    this.layer.scale.set(1);

    // Ajouter les tuiles au layer
    this.createTiles();
    this.createMinimapTiles();

    // Centrer le layer dans le viewport
    this.layer.x = 0;
    this.layer.y = 0;

    // Ajouter le layer au viewport
    this.viewport.addChild(this.layer);
  }

  /**
   * Configure les interactions
   */
  private setupInteractions() {
    if (!this.app) return;

    // Configurer le stage pour qu'il soit interactif
    this.app.stage.eventMode = 'static';
    this.app.stage.interactive = true;
    this.app.stage.sortableChildren = true;
  }

  /**
   * Crée les tuiles
   */
  private createTiles() {
    if (!this.layer) return;

    // Effacer les tuiles existantes
    this.layer.removeChildren();
    this.tileColors.clear();

    // Créer les tuiles
    for (let x = 0; x < this.WIDTH; x++) {
      for (let y = 0; y < this.HEIGHT; y++) {
        const tile = this.createTile(x, y);
        this.layer.addChild(tile);
      }
    }
  }

  /**
   * Crée une tuile à la position spécifiée
   */
  private createTile(x: number, y: number): Graphics {
    const tile = new Graphics();
    const color = this.getTileColor(x, y);
    
    // Stocker la couleur de base pour cette tuile
    this.tileColors.set(`${x},${y}`, color);
    
    // Dessiner le fond de la tuile
    this.drawTileWithColor(tile, color);

    // Positionner la tuile
    tile.x = x * this.BASE_PIXEL_SIZE;
    tile.y = y * this.BASE_PIXEL_SIZE;

    // Rendre la tuile interactive
    tile.eventMode = 'static';
    tile.cursor = 'pointer';
    tile.hitArea = new Rectangle(0, 0, this.BASE_PIXEL_SIZE, this.BASE_PIXEL_SIZE);

    // Ajouter l'effet de survol
    this.setupTileHoverEffect(tile, color);

    // Ajouter les gestionnaires de clic et de toucher
    this.setupTileInteractionHandlers(tile, color);

    return tile;
  }

  /**
   * Configure l'effet de survol pour une tuile
   */
  private setupTileHoverEffect(tile: Graphics, color: number) {
    tile.on('pointerover', () => {
      // Ne pas appliquer l'effet de survol si la tuile est sélectionnée
      if (tile !== this.selectedTile) {
        this.drawTileWithColor(tile, this.HOVER_COLOR);
      }
    });

    tile.on('pointerout', () => {
      // Ne pas modifier la tuile si elle est sélectionnée
      if (tile !== this.selectedTile) {
        this.drawTileWithColor(tile, color);
      }
    });
  }

  /**
   * Configure les gestionnaires d'interaction pour une tuile
   */
  private setupTileInteractionHandlers(tile: Graphics, color: number) {
    // Gestionnaire de clic
    tile.on('pointerdown', (event) => {
      event.preventDefault();
      const coords = this.getTileCoordinates(tile);
      if (coords) {
        this.handleTileSelection(tile, coords.x, coords.y, color);
      }
    });

    // Gestionnaire de toucher
    tile.on('touchstart', (event) => {
      event.preventDefault();
      const coords = this.getTileCoordinates(tile);
      if (coords) {
        this.handleTileSelection(tile, coords.x, coords.y, color);
      }
    });
  }

  /**
   * Gère la sélection d'une tuile
   */
  private handleTileSelection(tile: Graphics, x: number, y: number, color: number) {
    // Désactiver temporairement l'effet de survol
    tile.eventMode = 'none';
    
    // Sélectionner la tuile
    this.selectTile(tile, x, y);
    
    // Réinitialiser le pointeur après un court délai
    setTimeout(() => {
      if (tile === this.selectedTile) {
        this.drawTileWithColor(tile, color);
        this.selectedTile = null;
        tile.eventMode = 'static';
      }
    }, 100);
  }

  /**
   * Dessine une tuile avec une couleur spécifique
   */
  private drawTileWithColor(tile: Graphics, color: number) {
    tile.clear();
    tile.beginFill(color);
    tile.drawRect(0, 0, this.BASE_PIXEL_SIZE, this.BASE_PIXEL_SIZE);
    tile.endFill();
  }

  /**
   * Sélectionne une tuile
   */
  private selectTile(tile: Graphics, x: number, y: number) {
    // Désélectionner la tuile précédente si elle existe
    if (this.selectedTile) {
      const prevCoords = this.getTileCoordinates(this.selectedTile);
      if (prevCoords) {
        const prevColor = this.tileColors.get(`${prevCoords.x},${prevCoords.y}`) || 0x333333;
        this.drawTileWithColor(this.selectedTile, prevColor);
      }
    }

    // Ouvrir la modal
    this.isModalOpen = true;

    // Sélectionner la nouvelle tuile
    this.selectedTile = tile;
    this.selectedPixel = { x, y };

    // Dessiner la tuile avec son contour de sélection
    const baseColor = this.tileColors.get(`${x},${y}`) || 0x333333;
    
    // Effacer complètement la tuile
    tile.clear();
    
    // Dessiner le fond
    tile.beginFill(baseColor);
    tile.drawRect(0, 0, this.BASE_PIXEL_SIZE, this.BASE_PIXEL_SIZE);
    tile.endFill();
    
    // Dessiner le contour de sélection
    tile.lineStyle(3, this.SELECTION_COLOR);
    tile.drawRect(0, 0, this.BASE_PIXEL_SIZE, this.BASE_PIXEL_SIZE);
  }

  /**
   * Obtient les coordonnées d'une tuile
   */
  private getTileCoordinates(tile: Graphics): { x: number; y: number } | null {
    if (!this.layer || !this.viewport) return null;
    
    // Utiliser la position relative de la tuile dans le layer
    const x = Math.floor(tile.x / this.BASE_PIXEL_SIZE);
    const y = Math.floor(tile.y / this.BASE_PIXEL_SIZE);
    
    // Vérifier que les coordonnées sont dans les limites de la grille
    if (x >= 0 && x < this.WIDTH && y >= 0 && y < this.HEIGHT) {
      return { x, y };
    }
    
    return null;
  }

  /**
   * Obtient la couleur d'une tuile
   */
  private getTileColor(x: number, y: number): number {
    const isEvenX = x % 2 === 0;
    const isEvenY = y % 2 === 0;
    return (isEvenX && isEvenY) || (!isEvenX && !isEvenY) ? 0x333333 : 0x222222;
  }

  /**
   * Crée les tuiles de la minimap
   */
  private createMinimapTiles() {
    if (!this.minimapApp) return;

    const minimapLayer = new Container();
    const minimapWidth = this.MINIMAP_SIZE;
    const minimapHeight = this.MINIMAP_SIZE;
    const tileSize = Math.min(minimapWidth / this.WIDTH, minimapHeight / this.HEIGHT);

    // Dessiner le fond de la minimap
    const background = new Graphics();
    background.beginFill(0x1a1a1a);
    background.drawRect(0, 0, minimapWidth, minimapHeight);
    background.endFill();
    minimapLayer.addChild(background);

    // Dessiner la zone de contenu
    const contentArea = new Graphics();
    contentArea.beginFill(0x2c2e31);
    contentArea.drawRect(0, 0, this.WIDTH * tileSize, this.HEIGHT * tileSize);
    contentArea.endFill();
    minimapLayer.addChild(contentArea);

    // Créer les tuiles
    for (let x = 0; x < this.WIDTH; x++) {
      for (let y = 0; y < this.HEIGHT; y++) {
        const tile = new Graphics();
        const isEvenX = x % 2 === 0;
        const isEvenY = y % 2 === 0;
        const color = (isEvenX && isEvenY) || (!isEvenX && !isEvenY) ? 0x333333 : 0x222222;
        
        tile.beginFill(color);
        tile.drawRect(0, 0, tileSize, tileSize);
        tile.endFill();
        
        tile.x = x * tileSize;
        tile.y = y * tileSize;
        minimapLayer.addChild(tile);
      }
    }

    // Centrer le contenu dans la minimap
    minimapLayer.x = (minimapWidth - this.WIDTH * tileSize) / 2;
    minimapLayer.y = (minimapHeight - this.HEIGHT * tileSize) / 2;
    
    this.minimapApp.stage.addChild(minimapLayer);
  }

  /**
   * Configure la minimap
   */
  private setupMinimapViewport() {
    // Créer l'indicateur de viewport de la minimap
    const minimapContainer = this.minimapElement.nativeElement.parentElement;
    if (!minimapContainer) return;

    this.minimapViewport = minimapContainer.querySelector('.minimap-viewport');
    if (!this.minimapViewport) {
      this.minimapViewport = document.createElement('div');
      this.minimapViewport.className = 'minimap-viewport';
      minimapContainer.appendChild(this.minimapViewport);
    }
    this.updateMinimapViewport();
  }

  /**
   * Met à jour la minimap
   */
  private updateMinimapViewport() {
    try {
      if (!this.minimapViewport || !this.viewport || !this.minimapApp || !this.container?.nativeElement) {
        return;
      }

      const minimapWidth = this.MINIMAP_SIZE;
      const minimapHeight = this.MINIMAP_SIZE;
      const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
      const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;
      
      // Calculer l'échelle de la minimap
      const tileSize = Math.min(minimapWidth / this.WIDTH, minimapHeight / this.HEIGHT);
      const minimapScale = tileSize / this.BASE_PIXEL_SIZE;
      
      // Calculer la position du viewport dans les coordonnées de la minimap
      const viewportX = -this.viewport.x * minimapScale;
      const viewportY = -this.viewport.y * minimapScale;
      
      // Calculer la taille visible du viewport dans la minimap
      const viewportWidth = (this.container.nativeElement.clientWidth / this.currentScale) * minimapScale;
      const viewportHeight = (this.container.nativeElement.clientHeight / this.currentScale) * minimapScale;

      // Ajuster la position pour centrer le contenu
      const offsetX = (minimapWidth - this.WIDTH * tileSize) / 2;
      const offsetY = (minimapHeight - this.HEIGHT * tileSize) / 2;

      // Mettre à jour l'indicateur du viewport
      Object.assign(this.minimapViewport.style, {
        left: `${viewportX + offsetX}px`,
        top: `${viewportY + offsetY}px`,
        width: `${viewportWidth}px`,
        height: `${viewportHeight}px`
      });
    } catch (error) {
      console.error('Error in updateMinimapViewport:', error);
    }
  }

  /**
   * Configure l'observateur de redimensionnement
   */
  private setupResizeObserver() {
    try {
      if (!this.container?.nativeElement) {
        console.warn('Container element not available for ResizeObserver');
        return;
      }
      
      // Observer le conteneur lui-même
      const containerElement = this.container.nativeElement;
      
      this.resizeObserver = new ResizeObserver((entries) => {
        // Vérifier si la taille a réellement changé
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.handleResize();
          }
        }
      });
      
      this.resizeObserver.observe(containerElement);
    } catch (error) {
      console.error('Error in setupResizeObserver:', error);
    }
  }

  /**
   * Gère le redimensionnement
   */
  private handleResize() {
    try {
      if (!this.container?.nativeElement || !this.viewport || !this.app) {
        console.warn('Required elements not available for resize');
        return;
      }

      // Annuler le timeout précédent s'il existe
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // Utiliser un debounce pour éviter les appels trop fréquents
      this.resizeTimeout = setTimeout(() => {
        this.performResize();
      }, 100);
    } catch (error) {
      console.error('Error in handleResize:', error);
    }
  }

  /**
   * Effectue le redimensionnement
   */
  private performResize() {
    // Vérifier à nouveau que les éléments sont toujours disponibles
    if (!this.container?.nativeElement || !this.viewport || !this.app) {
      console.warn('Required elements not available for resize after timeout');
      return;
    }

    // Calculer les dimensions du conteneur
    const { width, height } = this.calculateContainerDimensions();
    
    // Vérifier que les dimensions sont valides
    if (width <= 0 || height <= 0) {
      console.warn('Invalid dimensions:', { width, height });
      return;
    }
    
    // Mettre à jour la taille du conteneur
    this.updateContainerSize(width, height);
    
    // Mettre à jour la taille du renderer
    this.app.renderer.resize(width, height);
    
    // Mettre à jour le viewport
    this.updateViewportSize(width, height);
    
    // Mettre à jour la minimap
    this.updateMinimapViewport();
  }

  /**
   * Calcule les dimensions du conteneur
   */
  private calculateContainerDimensions(): { width: number, height: number } {
    // Utiliser une hauteur fixe basée sur la fenêtre visible
    const windowHeight = window.innerHeight;
    const headerHeight = 56; // Hauteur approximative de l'en-tête
    const availableHeight = windowHeight - headerHeight;
    
    // Obtenir la largeur du conteneur
    const containerElement = this.container.nativeElement;
    const width = containerElement.clientWidth;
    
    // Utiliser la hauteur disponible calculée
    const height = Math.max(availableHeight, 400); // Minimum 400px
    
    console.log('Container dimensions:', { width, height, windowHeight, headerHeight });
    
    return { width, height };
  }

  /**
   * Met à jour la taille du conteneur
   */
  private updateContainerSize(width: number, height: number) {
    // Définir explicitement la hauteur du conteneur
    this.container.nativeElement.style.height = `${height}px`;
  }

  /**
   * Met à jour la taille du viewport
   */
  private updateViewportSize(width: number, height: number) {
    if (!this.viewport) return;

    // Mettre à jour la zone de hitArea du viewport
    this.viewport.hitArea = new Rectangle(0, 0, width, height);
    
    // Mettre à jour la taille du viewport
    this.viewport.resize(width, height);

    const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
    const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;

    // Recalculer l'échelle pour s'adapter à la nouvelle taille
    const widthScale = width / worldWidth;
    const heightScale = height / worldHeight;
    this.currentScale = Math.min(widthScale, heightScale) * 0.8;
    this.viewport.scale.set(this.currentScale);

    // Recentrer la vue
    this.viewport.x = (width - worldWidth * this.currentScale) / 2;
    this.viewport.y = (height - worldHeight * this.currentScale) / 2;

    // Recentrer le layer dans le viewport
    if (this.layer) {
      this.layer.x = 0;
      this.layer.y = 0;
    }
  }

  /**
   * Nettoie les ressources
   */
  private cleanup() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.app) {
      this.app.destroy(true, true);
      this.app = null;
    }
    if (this.minimapApp) {
      this.minimapApp.destroy(true, true);
      this.minimapApp = null;
    }
    this.viewport = null;
    this.layer = null;
  }

  /**
   * Zoom avant
   */
  public zoomIn() {
    if (this.viewport) {
      // Calculer la nouvelle échelle
      const newScale = this.currentScale * (1 + this.ZOOM_STEP);
      
      // Limiter l'échelle aux valeurs min/max
      const clampedScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, newScale));
      
      // Appliquer l'échelle au viewport
      this.viewport.scale.set(clampedScale);
      
      // Mettre à jour l'échelle actuelle
      this.currentScale = clampedScale;
      
      // Mettre à jour la minimap
      this.updateMinimapViewport();
      
      console.log('Zoom in', this.currentScale);
    }
  }

  /**
   * Zoom arrière
   */
  public zoomOut() {
    if (this.viewport) {
      // Calculer la nouvelle échelle
      const newScale = this.currentScale * (1 - this.ZOOM_STEP);
      
      // Limiter l'échelle aux valeurs min/max
      const clampedScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, newScale));
      
      // Appliquer l'échelle au viewport
      this.viewport.scale.set(clampedScale);
      
      // Mettre à jour l'échelle actuelle
      this.currentScale = clampedScale;
      
      // Mettre à jour la minimap
      this.updateMinimapViewport();
      
      console.log('Zoom out', this.currentScale);
    }
  }
}
