# Linecross: Fox Spirit Puzzle

A mesmerizing puzzle game built with Phaser 3 where you untangle the chi energy lines by swapping fox spirit masks.

## How to Play

1. The game presents a network of fox spirit masks connected by animated chi energy lines.
2. Some lines cross each other, creating tangled energy flows.
3. Click on a mask to select it (it will grow larger).
4. Click on another mask to swap their positions.
5. Your goal is to rearrange the masks so that no lines cross each other.
6. When all lines are untangled, the spirits are saved and you can click anywhere to restart with a new puzzle.

## Features

- **Animated Elements**: Chi energy lines use sprite sheet animations for a dynamic visual experience.
- **Themed Assets**: Custom fox spirit mask images (flame and non-flame variants).
- **Responsive Design**: Game scales to fit the full window.
- **Customizable Settings**: Adjust the maximum number of masks and cycles via UI controls.
- **Interactive Win State**: Themed victory message appears when solved, with click-anywhere restart.

## Requirements

- A modern web browser with JavaScript enabled.
- No additional installations required - runs directly in the browser.

## Running the Game

1. Clone or download the project files.
2. Open `index.html` in your web browser.
3. Adjust the settings sliders for masks and cycles if desired.
4. Click the "Restart Game" button or solve the puzzle and click anywhere to start.

## Controls

- **Mouse Click**: Select and swap masks, or restart when solved.
- **UI Sliders**: Adjust max masks (6-20) and max cycles (2-5) before restarting.

## Technical Details

- Built with Phaser 3 for game logic and rendering.
- Uses HTML5 Canvas/WebGL for smooth animations.
- Random graph generation ensures each puzzle is unique.
- Collision detection for line crossings using geometric algorithms.

## Assets

- `images/FlameMask110.png`: Flame fox spirit mask
- `images/NonFlameMask110.png`: Non-flame fox spirit mask
- `images/sprite-sheet2.png`: Animated chi energy line sprite sheet

## License

This project is open-source. Feel free to modify and distribute.