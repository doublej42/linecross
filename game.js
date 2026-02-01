// Main game scene class extending Phaser.Scene
class GameScene extends Phaser.Scene {
    // Constructor for the scene
    constructor() {
        super({ key: 'GameScene' });
    }

    // Preload method - loads assets before the game starts
    preload() {
        // Load orb images
        this.load.image('flame', 'images/FlameMask110.png');
        this.load.image('nonflame', 'images/NonFlameMask110.png');
        // Load line GIFs
        this.load.image('white', 'images/white.gif');
        this.load.image('red', 'images/red.gif');
        this.load.image('blue', 'images/blue.gif');
    }

    // Create method - initializes the game scene
    create() {
        // Initialize arrays and variables
        this.orbs = []; // Array to hold orb objects
        this.edges = []; // Array to hold edge connections between orbs
        this.selectedOrb = null; // Currently selected orb for swapping
        this.isAnimating = false; // Flag to prevent actions during animation

        // Generate graph and place orbs, ensuring initial layout has crossings
        this.generateGraph(); // Create the graph structure
        this.placeOrbs(); // Position orbs on screen


        while (this.countCrossings() === 0) {
            // swap the positions of two random orbs to create crossings
            let index1 = Phaser.Math.Between(0, this.orbs.length - 1);
            let index2 = Phaser.Math.Between(0, this.orbs.length - 1);
            //make sure we have two different orbs

            while (index1 === index2) {
                index2 = Phaser.Math.Between(0, this.orbs.length - 1);
            }
            // Swap x and y coordinates of the two selected orbs
            this.swapOrbs(this.orbs[index1], this.orbs[index2]);

        } // Regenerate if no crossings exist
        this.drawOrbs();
        this.updateLines(); // Create line sprites

        // Add click handlers for orb interaction
        this.input.on('gameobjectdown', this.onOrbClick, this);
    }

    // Generates a random graph with orbs and connecting edges forming cycles
    generateGraph() {
        // Randomly choose number of orbs (between 6 and 20)
        const numOrbs = Phaser.Math.Between(6, 20);
        // Randomly choose number of cycles bvetween 2 and numOrbs/3
        const numCycles = Phaser.Math.Between(2, Math.max(2, Math.floor(numOrbs / 3)));
        console.log("Generating graph with " + numOrbs + " orbs and " + numCycles + " cycles.");
        // Initialize orbs array with id and placeholder positions
        this.orbs = Array.from({ length: numOrbs }, (_, i) => ({ id: i, x: 0, y: 0 }));
        // Initialize edges array
        this.edges = [];

        // Calculate sizes for each cycle
        let remainingOrbs = numOrbs;
        let cycleSizes = [];
        for (let i = 0; i < numCycles; i++) {
            const minSize = 3; // Minimum cycle size
            const maxSize = remainingOrbs - (numCycles - i - 1) * 3; // Ensure enough orbs for remaining cycles
            if(i === numCycles - 1) {
                // Last cycle takes all remaining orbs
                cycleSizes.push(remainingOrbs);
                break;
            }
            const size = Phaser.Math.Between(minSize, Math.max(minSize, maxSize));
            cycleSizes.push(size);
            remainingOrbs -= size;
        }
        console.log("Cycle sizes: ", cycleSizes);
        // Assign orbs to cycles and create edges
        let orbIndex = 0;
        let cycleId = 0;
        for (const size of cycleSizes) {
            const cycle = []; // Temporary array for current cycle orbs
            for (let i = 0; i < size; i++) {
                cycle.push(orbIndex++);
            }
            // Create edges for the cycle (connect each orb to the next, wrapping around)
            for (let i = 0; i < size; i++) {
                const a = cycle[i];
                const b = cycle[(i + 1) % size];

                this.edges.push({
                    a: a,
                    b: b,
                    crossing: false,
                    cycleId: cycleId
                });
            }
            cycleId++;
        }
    }

    // Places orbs randomly on the screen, ensuring minimum distance between them
    placeOrbs() {
        const width = this.sys.game.config.width; // Game canvas width
        const height = this.sys.game.config.height; // Game canvas height
        const margin = 50; // Margin from edges
        // Place each orb at a random position, ensuring minimum distance from already placed orbs
        this.orbs.forEach((orb, i) => {
            let x, y, attempts = 0;
            do {
                // Generate random position within margins
                x = Phaser.Math.Between(margin, width - margin);
                y = Phaser.Math.Between(margin, height - margin);
                attempts++;
                // Ensure position is at least 60 pixels from already placed orbs
            } while (this.orbs.slice(0, i).some(placedOrb => Phaser.Math.Distance.Between(placedOrb.x, placedOrb.y, x, y) < 60) && attempts < 100);
            // Assign position to orb
            orb.x = x;
            orb.y = y;
            //console.log("Orb " + orb.id + " position: (" + orb.x + ", " + orb.y + ")");
        });
    }

    // Draws the orbs with appropriate images based on cycle status
    drawOrbs() {
        const nonCrossingCycles = this.getNonCrossingCycles();
        this.orbs.forEach((orb) => {
            // Determine texture: flame if in a non-crossing cycle, nonflame otherwise
            const cycleId = this.getOrbCycle(orb.id);
            const key = (cycleId !== -1 && nonCrossingCycles.has(cycleId)) ? 'flame' : 'nonflame';
            // Create a sprite for the orb
            const sprite = this.add.sprite(orb.x, orb.y, key);
            sprite.setScale(0.5); // Start at half size
            sprite.setInteractive(); // Make sprite clickable
            sprite.orb = orb; // Reference to orb object
            orb.sprite = sprite; // Reference to sprite
        });
    }

    // Draws red lines between connected orbs
    drawLines() {
        this.graphics.lineStyle(2, 0xff0000); // Set line style: 2px width, red color
        // Draw a line for each edge
        for (let edge of this.edges) {
            const orbA = this.orbs[edge.a];
            const orbB = this.orbs[edge.b];

            if (edge.crossing) {
                this.graphics.lineStyle(4, 0x0000ff); // Set line style: 4px width, blue color for crossing
            } else {
                this.graphics.lineStyle(2, 0xff0000); // Set line style: 2px width, red color for normal
            }
            this.graphics.lineBetween(orbA.x, orbA.y, orbB.x, orbB.y);
        }
    }

    // Handles clicking on orbs for selection and swapping
    onOrbClick(pointer, gameObject) {
        if (this.isAnimating) return; // Prevent actions during animation
        console.log("Orb clicked: ", gameObject.orb);
        if (this.selectedOrb === null) {
            // No orb selected: select this one
            this.selectedOrb = gameObject.orb;
            
            gameObject.setScale(0.75); // Scale to full size
        } else if (this.selectedOrb === gameObject.orb) {
            // Clicking the same orb: deselect
            this.selectedOrb.sprite.setScale(0.5); // Scale back to half size
            this.selectedOrb = null;
        } else {
            // Swap positions of selected and clicked orbs
            const orb1 = this.selectedOrb;
            const orb2 = gameObject.orb;
            this.swapOrbs(orb1, orb2);
            this.selectedOrb.sprite.setScale(0.5); // Scale back to half size
            this.selectedOrb = null;
            
            gameObject.setScale(0.5); // Scale back to half size

            // Animate the swap
            this.isAnimating = true;
            let tweenCount = 0;
            const onTweenComplete = () => {
                tweenCount++;
                if (tweenCount === 2) {
                    this.isAnimating = false;
                    // Check if puzzle is solved (no crossings)
                    if (this.countCrossings() === 0) {
                        this.add.text(400, 300, 'Solved!', { fontSize: '48px', fill: '#a33bb8' }).setOrigin(0.5);
                    }
                    this.updateOrbs(); // Update orb colors based on new crossing status
                    this.updateLines(); // Update line colors based on crossing status
                }
            };

            // Tween orb1's sprite to new position
            this.tweens.add({
                targets: orb1.sprite,
                x: orb1.x,
                y: orb1.y,
                duration: 500,
                ease: 'Power2',
                onUpdate: () => this.updateLines(),
                onComplete: onTweenComplete
            });

            // Tween orb2's sprite to new position
            this.tweens.add({
                targets: orb2.sprite,
                x: orb2.x,
                y: orb2.y,
                duration: 500,
                ease: 'Power2',
                onUpdate: () => this.updateLines(),
                onComplete: onTweenComplete
            });
        }
    }

    //this swaps two orbs possitions. It can used before the first drawing so it doesn't modify graphics.
    swapOrbs(orb1, orb2) {
        console.log("Swapping orbs: ", orb1, orb2);
        // Swap x and y coordinates
        [orb1.x, orb1.y, orb2.x, orb2.y] = [orb2.x, orb2.y, orb1.x, orb1.y];
    }

    // counts any crossings and marks the edge as crossing.
    countCrossings() {
        let ret = 0
        for (let i = 0; i < this.edges.length; i++) {
            this.edges[i].crossing = false; // Reset crossing status
        }
        // Compare every pair of edges
        for (let i = 0; i < this.edges.length; i++) {
            for (let j = i + 1; j < this.edges.length; j++) {
                const { a: a1, b: b1 } = this.edges[i];// Endpoints of first edge
                const { a: a2, b: b2 } = this.edges[j]; // Endpoints of second edge
                if (this.edges[i].crossing === true && this.edges[j].crossing === true) {
                    continue; // Already marked as crossing
                }
                // skip if they share a vertex
                if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2) {
                    continue; // Shared vertex, cannot cross
                }

                const p1 = this.orbs[a1]; // Position of first point of first edge  
                const p2 = this.orbs[b1]; // Position of second point of first edge
                const p3 = this.orbs[a2]; // Position of first point of second edge
                const p4 = this.orbs[b2]; // Position of second point of second edge
                // Check if the two line segments intersect
                if (this.linesIntersect(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)) {
                    //console.log("Crossing between edges: ", this.edges[i], this.edges[j]);
                    //return true; // Crossing found
                    this.edges[i].crossing = true;
                    this.edges[j].crossing = true;
                    ret++;
                }
            }
        }
        console.log("Edges: ", this.edges);
        console.log("Crossings found: " + ret);
        return ret; // Crossings found count
    }

    // Checks if two line segments intersect using parametric equations
    linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Calculate denominator for intersection formula
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return false; // Lines are parallel
        // Calculate parameters t and u
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        // Check if intersection point is within both line segments
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    // Returns a set of cycle IDs that have no crossing edges
    getNonCrossingCycles() {
        const cycleCrossings = new Map();
        // Count crossings per cycle
        for (const edge of this.edges) {
            if (!cycleCrossings.has(edge.cycleId)) {
                cycleCrossings.set(edge.cycleId, 0);
            }
            if (edge.crossing) {
                cycleCrossings.set(edge.cycleId, cycleCrossings.get(edge.cycleId) + 1);
            }
        }
        // Find cycles with zero crossings
        const nonCrossing = new Set();
        for (const [cycleId, crossings] of cycleCrossings) {
            if (crossings === 0) {
                nonCrossing.add(cycleId);
            }
        }
        return nonCrossing;
    }

    // Updates the textures of orb sprites based on current cycle status
    updateOrbs() {
        const nonCrossingCycles = this.getNonCrossingCycles();
        this.orbs.forEach((orb) => {
            const cycleId = this.getOrbCycle(orb.id);
            const key = (cycleId !== -1 && nonCrossingCycles.has(cycleId)) ? 'flame' : 'nonflame';
            orb.sprite.setTexture(key);
            orb.sprite.x = orb.x;
            orb.sprite.y = orb.y;
        });
    }

    updateLines() {
        for (let edge of this.edges) {
            const orbA = this.orbs[edge.a];
            const orbB = this.orbs[edge.b];
            const dx = orbB.sprite.x - orbA.sprite.x;
            const dy = orbB.sprite.y - orbA.sprite.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            let key;
            if (edge.crossing) {
                key = 'red';
            } else {
                const nonCrossingCycles = this.getNonCrossingCycles();
                if (nonCrossingCycles.has(edge.cycleId)) {
                    key = 'white';
                } else {
                    key = 'blue';
                }
            }
            if (!edge.sprite) {
                edge.sprite = this.add.sprite(0, 0, key);
            } else {
                edge.sprite.setTexture(key);
            }
            edge.sprite.x = (orbA.sprite.x + orbB.sprite.x) / 2;
            edge.sprite.y = (orbA.sprite.y + orbB.sprite.y) / 2;
            edge.sprite.rotation = angle;
            edge.sprite.setScale(length / edge.sprite.width, 1);
        }
    }

    // Returns the cycle ID for a given orb ID, or -1 if not found
    getOrbCycle(orbId) {
        for (const edge of this.edges) {
            if (edge.a === orbId || edge.b === orbId) {
                return edge.cycleId;
            }
        }
        return -1;
    }
}

// Phaser game configuration
const config = {
    type: Phaser.AUTO, // Automatically choose renderer (WebGL or Canvas)
    width: 800, // Game width
    height: 600, // Game height
    scene: GameScene, // Main scene class
    parent: 'game-container' // HTML element to attach to
};

// Create and start the Phaser game
const game = new Phaser.Game(config);