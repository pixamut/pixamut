import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { Application, Container, Point, Graphics } from 'pixi.js';
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
  public selectedPixel: { x: number; y: number } | null = null;
  public isModalOpen: boolean = false;
  private app: Application | null = null;
  private minimapApp: Application | null = null;
  private viewport: Viewport | null = null;
  private layer: Container | null = null;
  private minimapViewport: HTMLElement | null = null;
  private isDragging = false;
  private lastPosition: Point | null = null;
  private currentScale = 1;
  private isInit = false;
  private resizeObserver: ResizeObserver | null = null;
  private selectedTile: Graphics | null = null;
  private tileColors: Map<string, number> = new Map();
  private resizeTimeout: any = null;

  // Constants
  private readonly BASE_PIXEL_SIZE = 32;
  private readonly WIDTH = 100;
  private readonly HEIGHT = 100;
  private readonly MIN_SCALE = 0.1;
  private readonly MAX_SCALE = 10;
  private readonly ZOOM_STEP = 0.2;
  private readonly SELECTION_COLOR = 0x00ff00; // Couleur verte pour la sélection
  private readonly HOVER_COLOR = 0x666666; // Couleur grise pour le survol

  constructor() {}

  ngOnInit() {
    this.initApp();
  }

  ngOnDestroy() {
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

  private async initApp() {
    if (!this.container.nativeElement || this.app) return;

    // Initialize main display
    this.app = new Application();
    await this.app.init({
      backgroundAlpha: 1,
      resizeTo: this.container.nativeElement,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
      backgroundColor: 0xffffff,
      eventMode: 'static', // Enable interaction
      eventFeatures: {
        move: true,
        globalMove: true,
        click: true,
        wheel: true
      }
    });

    this.container.nativeElement.appendChild(this.app.canvas);

    // Initialize minimap
    this.minimapApp = new Application();
    await this.minimapApp.init({
      width: 200,
      height: 200,
      backgroundAlpha: 1,
      resolution: 1,
      antialias: true,
      backgroundColor: 0x2c2e31,
    });

    this.minimapElement.nativeElement.appendChild(this.minimapApp.canvas);

    const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
    const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;

    // Create viewport using pixi-viewport
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

    this.viewport.eventMode = "static";
    this.viewport.sortableChildren = true;

    this.viewport
      .drag()
      .pinch({
        percent: 1,
        noDrag: false,
        factor: 2,
      })
      .wheel()
      .clampZoom({
        minScale: this.MIN_SCALE,
        maxScale: this.MAX_SCALE,
      });

    // Create content layer
    this.layer = new Container();
    this.layer.eventMode = 'static';
    this.layer.cursor = 'pointer';
    this.layer.sortableChildren = true;
    this.layer.width = worldWidth;
    this.layer.height = worldHeight;

    // Add tiles to the layer
    this.createTiles();
    this.createMinimapTiles();

    this.viewport.addChild(this.layer);
    this.app.stage.addChild(this.viewport);

    // Center the viewport
    const widthScale = this.container.nativeElement.clientWidth / worldWidth;
    const heightScale = this.container.nativeElement.clientHeight / worldHeight;
    this.currentScale = Math.min(widthScale, heightScale) * 0.8;
    this.viewport.scale.set(this.currentScale);

    // Center the viewport
    this.viewport.x = (this.container.nativeElement.clientWidth - worldWidth * this.currentScale) / 2;
    this.viewport.y = (this.container.nativeElement.clientHeight - worldHeight * this.currentScale) / 2;

    // Set up interaction
    this.setupMinimapViewport();

    this.app.ticker.minFPS = 0;
    this.app.ticker.add(this.updateMinimapViewport.bind(this));
    this.app.ticker.start();
    this.isInit = true;

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private createTiles() {
    if (!this.layer) return;

    // Clear existing tiles
    this.layer.removeChildren();
    this.tileColors.clear();

    // Create tiles
    for (let x = 0; x < this.WIDTH; x++) {
      for (let y = 0; y < this.HEIGHT; y++) {
        const tile = new Graphics();
        const color = this.getTileColor(x, y);
        
        // Store the base color for this tile
        this.tileColors.set(`${x},${y}`, color);
        
        // Draw tile background
        this.drawTileWithColor(tile, color);

        // Position the tile
        tile.x = x * this.BASE_PIXEL_SIZE;
        tile.y = y * this.BASE_PIXEL_SIZE;

        // Make tile interactive
        tile.eventMode = 'static';
        tile.cursor = 'pointer';

        // Add hover effect
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

        // Add click and touch handlers
        tile.on('pointerdown', (event) => {
          // Prevent default touch behavior
          event.preventDefault();
          const coords = this.getTileCoordinates(tile);
          if (coords) {
            console.log(`Clicked/touched tile at (${coords.x}, ${coords.y})`);
            
            // Désactiver temporairement l'effet de survol
            tile.eventMode = 'none';
            
            this.selectTile(tile, coords.x, coords.y);
            
            // Réinitialiser le pointeur après un court délai
            setTimeout(() => {
              if (tile === this.selectedTile) {
                this.drawTileWithColor(tile, color);
                this.selectedTile = null;
                this.selectedPixel = null;
                this.isModalOpen = true;
                // Réactiver l'effet de survol
                tile.eventMode = 'static';
              }
            }, 500); // Attendre 500ms avant de réinitialiser
          }
        });

        // Add touch-specific handlers
        tile.on('touchstart', (event) => {
          event.preventDefault();
          const coords = this.getTileCoordinates(tile);
          if (coords) {
            console.log(`Touch started on tile at (${coords.x}, ${coords.y})`);
            
            // Désactiver temporairement l'effet de survol
            tile.eventMode = 'none';
            
            this.selectTile(tile, coords.x, coords.y);
            
            // Réinitialiser le pointeur après un court délai
            setTimeout(() => {
              if (tile === this.selectedTile) {
                this.drawTileWithColor(tile, color);
                this.selectedTile = null;
                this.selectedPixel = null;
                
                // Réactiver l'effet de survol
                tile.eventMode = 'static';
              }
            }, 500); // Attendre 500ms avant de réinitialiser
          }
        });

        this.layer.addChild(tile);
      }
    }
  }

  private drawTileWithColor(tile: Graphics, color: number) {
    tile.clear();
    tile.beginFill(color);
    tile.drawRect(0, 0, this.BASE_PIXEL_SIZE, this.BASE_PIXEL_SIZE);
    tile.endFill();
  }

  private selectTile(tile: Graphics, x: number, y: number) {
    // Désélectionner la tuile précédente si elle existe
    if (this.selectedTile) {
      const prevCoords = this.getTileCoordinates(this.selectedTile);
      if (prevCoords) {
        const prevColor = this.tileColors.get(`${prevCoords.x},${prevCoords.y}`) || 0x333333;
        this.drawTileWithColor(this.selectedTile, prevColor);
      }
    }

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

  private getTileColor(x: number, y: number): number {
    const isEvenX = x % 2 === 0;
    const isEvenY = y % 2 === 0;
    return (isEvenX && isEvenY) || (!isEvenX && !isEvenY) ? 0x333333 : 0x222222;
  }

  private createMinimapTiles() {
    if (!this.minimapApp) return;

    const minimapLayer = new Container();
    const tileSize = 2; // Small size for minimap tiles

    for (let x = 0; x < this.WIDTH; x++) {
      for (let y = 0; y < this.HEIGHT; y++) {
        const tile = new Graphics();
        
        // Alterner entre gris et noir pour créer un motif en damier
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

    // Center the minimap
    minimapLayer.x = (200 - this.WIDTH * tileSize) / 2;
    minimapLayer.y = (200 - this.HEIGHT * tileSize) / 2;
    
    this.minimapApp.stage.addChild(minimapLayer);
  }

  private setupMinimapViewport() {
    // Create minimap viewport indicator
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

  private updateMinimapViewport() {
    try {
      if (!this.minimapViewport || !this.viewport || !this.minimapApp || !this.container?.nativeElement) {
        return;
      }

      const worldWidth = this.WIDTH * this.BASE_PIXEL_SIZE;
      const worldHeight = this.HEIGHT * this.BASE_PIXEL_SIZE;
      
      // Calculate visible area
      const visibleWidth = this.container.nativeElement.clientWidth / (this.currentScale * this.BASE_PIXEL_SIZE);
      const visibleHeight = this.container.nativeElement.clientHeight / (this.currentScale * this.BASE_PIXEL_SIZE);
      
      // Calculate viewport position in world coordinates
      const worldX = -this.viewport.x / (this.currentScale * this.BASE_PIXEL_SIZE);
      const worldY = -this.viewport.y / (this.currentScale * this.BASE_PIXEL_SIZE);
      
      // Convert to minimap coordinates
      const minimapScale = 200 / (this.WIDTH * 2); // 2 is the minimap tile size
      const minimapX = (worldX * minimapScale) + (200 - this.WIDTH * 2) / 2;
      const minimapY = (worldY * minimapScale) + (200 - this.HEIGHT * 2) / 2;
      const minimapWidth = visibleWidth * minimapScale;
      const minimapHeight = visibleHeight * minimapScale;

      // Update viewport indicator
      Object.assign(this.minimapViewport.style, {
        left: `${minimapX}px`,
        top: `${minimapY}px`,
        width: `${minimapWidth}px`,
        height: `${minimapHeight}px`
      });
    } catch (error) {
      console.error('Error in updateMinimapViewport:', error);
    }
  }

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
        // Vérifier à nouveau que les éléments sont toujours disponibles
        if (!this.container?.nativeElement || !this.viewport || !this.app) {
          console.warn('Required elements not available for resize after timeout');
          return;
        }

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
        
        // Vérifier que les dimensions sont valides
        if (width <= 0 || height <= 0) {
          console.warn('Invalid dimensions:', { width, height });
          return;
        }
        
        // Définir explicitement la hauteur du conteneur
        containerElement.style.height = `${height}px`;
        
        // Mettre à jour la taille du renderer
        this.app.renderer.resize(width, height);
        
        // Mettre à jour la taille du viewport
        if (this.viewport) {
          this.viewport.resize(width, height);
        }

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

        // Mettre à jour la minimap
        this.updateMinimapViewport();
      }, 100); // Attendre 100ms avant d'exécuter le redimensionnement
    } catch (error) {
      console.error('Error in handleResize:', error);
    }
  }

  // Zoom control methods
  public zoomIn() {
    if (this.viewport) {
      this.viewport.zoom(1 + this.ZOOM_STEP);
    }
  }

  public zoomOut() {
    if (this.viewport) {
      this.viewport.zoom(1 - this.ZOOM_STEP);
    }
  }
}
