import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

class Square extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            animate: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.board[this.props.index] !==
            this.props.board[this.props.index]
        ) {
            this.setState({ animate: true });
            setTimeout(() => this.setState({ animate: false }), 300);
        }
    }

    render() {
        const { board, index, onClick, validMovesIndices } = this.props;
        const { animate } = this.state;

        let content = null;
        if (board[index] === "W") {
            content = (
                <svg width="40" height="40">
                    <circle cx="20" cy="20" r="15" fill="white" />
                </svg>
            );
        } else if (board[index] === "B") {
            content = (
                <svg width="40" height="40">
                    <circle cx="20" cy="20" r="15" fill="black" />
                </svg>
            );
        } else if (validMovesIndices.includes(index)) {
            content = (
                <svg width="20" height="20">
                    <circle cx="10" cy="10" r="8" fill="#ee6941" />
                </svg>
            );
        }

        return (
            <button
                className={`square ${animate ? "animate" : ""}`}
                onClick={onClick}
            >
                {content}
            </button>
        );
    }
}

class Board extends React.Component {
    renderSquare(i, j) {
        return (
            <Square
                validMovesIndices={this.props.validMovesIndices}
                onClick={() => this.props.onClick(j, i)}
                board={this.props.board}
                index={8 * i + j}
                key={8 * i + j}
            />
        );
    }

    createBoard = () => {
        let board = [];

        for (let i = 0; i < 8; i++) {
            let children = [];
            for (let j = 0; j < 8; j++) {
                children.push(this.renderSquare(i, j));
            }
            board.push(
                <div className="board-row" key={i}>
                    {children}
                </div>
            );
        }
        return board;
    };

    render() {
        return <div className="board">{this.createBoard()}</div>;
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [
                {
                    board: createStartBoard(),
                    turn: "B",
                    blackScore: 2,
                    whiteScore: 2,
                    winner: null,
                    tie: null,
                    gameOver: false,
                },
            ],
            singlePlayer: true,
            playerColor: "B",
            machineColor: "W",
            difficulty: "medium", // Додано для вибору рівня складності
        };
    }

    componentDidUpdate() {
        if (
            this.state.singlePlayer &&
            this.state.history[this.state.history.length - 1].turn ===
                this.state.machineColor
        ) {
            setTimeout(() => {
                this.machineMove();
            }, 1000);
        }
    }

    machineMove() {
        if (
            this.state.history[this.state.history.length - 1].turn ===
                this.state.machineColor &&
            this.state.history[this.state.history.length - 1].winner === null &&
            this.state.history[this.state.history.length - 1].tie === null
        ) {
            let move = getBestMove(
                this.state.history[this.state.history.length - 1].board,
                this.state.history[this.state.history.length - 1].turn,
                this.state.difficulty
            );
            this.handleClick(move[0], move[1], true);
        }
    }

    singlePlayerMode() {
        this.setState({
            history: [
                {
                    board: createStartBoard(),
                    turn: "B",
                    blackScore: 2,
                    whiteScore: 2,
                    winner: null,
                    tie: null,
                    gameOver: false,
                },
            ],
            singlePlayer: true,
            playerColor: "B",
            machineColor: "W",
        });
    }

    restart() {
        this.singlePlayerMode();
    }

    handleClick(x, y, machineMove = false) {
        if (
            !machineMove &&
            this.state.history[this.state.history.length - 1].turn ===
                this.state.machineColor
        ) {
            return;
        }

        let board =
            this.state.history[this.state.history.length - 1].board.slice();

        if (
            isValidMove(
                board,
                this.state.history[this.state.history.length - 1].turn,
                [x, y]
            )
        ) {
            makeMove(
                board,
                this.state.history[this.state.history.length - 1].turn,
                [x, y]
            );

            let opponent =
                this.state.history[this.state.history.length - 1].turn === "B"
                    ? "W"
                    : "B";
            let newTurn =
                this.state.history[this.state.history.length - 1].turn;
            //If the opponent has no available moves, the turn remains with the current player
            if (validMoves(board, opponent).length > 0) {
                newTurn = opponent;
            }

            let blackScore = countScore(board, "B");
            let whiteScore = countScore(board, "W");

            let winner = null;
            let tie = null;
            let gameOver = false;
            if (
                validMoves(board, opponent).length === 0 &&
                validMoves(
                    board,
                    this.state.history[this.state.history.length - 1].turn
                ).length === 0
            ) {
                gameOver = true;
                if (
                    countScore(
                        board,
                        this.state.history[this.state.history.length - 1].turn
                    ) === countScore(board, opponent)
                ) {
                    tie = true;
                    winner = null;
                } else {
                    tie = false;
                    winner =
                        countScore(
                            board,
                            this.state.history[this.state.history.length - 1]
                                .turn
                        ) > countScore(board, opponent)
                            ? this.state.history[this.state.history.length - 1]
                                  .turn
                            : opponent;
                }
            }

            this.setState({
                history: this.state.history.concat({
                    board: board,
                    turn: newTurn,
                    blackScore: blackScore,
                    whiteScore: whiteScore,
                    winner: winner,
                    tie: tie,
                    gameOver: gameOver,
                }),
            });
        }
    }

    moveBack() {
        if (this.state.history.length > 1 && !this.state.singlePlayer) {
            this.setState({
                history: this.state.history.slice(
                    0,
                    this.state.history.length - 1
                ),
            });
        } else if (this.state.history.length > 1 && this.state.singlePlayer) {
            if (
                !this.state.history[this.state.history.length - 1].gameOver &&
                this.state.history[this.state.history.length - 1].turn ===
                    this.state.playerColor
            ) {
                let i;
                let j = 0;
                for (i = this.state.history.length - 1; i >= 0; i--) {
                    if (j === 2) {
                        break;
                    } else if (
                        this.state.history[i].turn === this.state.playerColor
                    ) {
                        j++;
                    }
                }
                i++;
                this.setState({ history: this.state.history.slice(0, i + 1) });
            } else if (
                this.state.history[this.state.history.length - 1].gameOver
            ) {
                let i;
                let j = 0;
                for (i = this.state.history.length - 2; i >= 0; i--) {
                    if (j === 1) {
                        break;
                    } else if (
                        this.state.history[i].turn === this.state.playerColor
                    ) {
                        j++;
                    }
                }
                i++;
                this.setState({ history: this.state.history.slice(0, i + 1) });
            }
        }
    }

    setDifficulty(difficulty) {
        this.setState({ difficulty });
    }

    render() {
        let turnColor =
            this.state.history[this.state.history.length - 1].turn === "B"
                ? "black"
                : "white";
        let winnerText = "No winner yet";
        if (this.state.history[this.state.history.length - 1].winner !== null) {
            winnerText =
                this.state.history[this.state.history.length - 1].winner === "B"
                    ? "Black wins"
                    : "White wins";
        } else if (
            this.state.history[this.state.history.length - 1].tie === true
        ) {
            winnerText = "Tie In Game";
        }

        return (
            <div>
                <p id="status">
                    Turn
                    <svg width="40" height="40">
                        <circle cx="20" cy="20" r="15" fill={turnColor} />
                    </svg>
                </p>
                <p id="winner-status">{winnerText}</p>
                <Board
                    board={
                        this.state.history[this.state.history.length - 1].board
                    }
                    onClick={(x, y) => this.handleClick(x, y)}
                    validMovesIndices={validMoves(
                        this.state.history[this.state.history.length - 1].board,
                        this.state.history[this.state.history.length - 1].turn
                    ).map(([x, y]) => {
                        return 8 * y + x;
                    })}
                />
                <div className="select-mode">
                    <button id="restart" onClick={this.restart.bind(this)}>
                        Restart
                    </button>
                    <select
                        value={this.state.difficulty}
                        onChange={(e) => this.setDifficulty(e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                <div className="scores">
                    <div className="black-score">
                        <svg width="40" height="40">
                            <circle cx="20" cy="20" r="15" fill="black" />
                        </svg>
                        <p>
                            {
                                this.state.history[
                                    this.state.history.length - 1
                                ].blackScore
                            }
                        </p>
                    </div>
                    <div className="white-score">
                        <svg width="40" height="40">
                            <circle cx="20" cy="20" r="15" fill="white" />
                        </svg>
                        <p>
                            {
                                this.state.history[
                                    this.state.history.length - 1
                                ].whiteScore
                            }
                        </p>
                    </div>
                </div>
                <button id="undo" onClick={this.moveBack.bind(this)}>
                    Undo
                </button>
            </div>
        );
    }
}

ReactDOM.render(<Game />, document.getElementById("root"));

function createStartBoard() {
    let board = Array(64).fill(null);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (i === 3 && j === 3) {
                board[8 * i + j] = "W";
            } else if (i === 3 && j === 4) {
                board[8 * i + j] = "B";
            } else if (i === 4 && j === 3) {
                board[8 * i + j] = "B";
            } else if (i === 4 && j === 4) {
                board[8 * i + j] = "W";
            }
        }
    }

    return board;
}

function isValidMove(board, turn, [x, y]) {
    if (!(0 <= x <= 7) || !(0 <= y <= 7) || board[8 * y + x] !== null) {
        return false;
    }
    //delta = (x, y); starting from the upper left corner
    // right, left, up, down, right-up, left-down, left-up, right-down
    let deltas = [
        [1, 0],
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
        [1, 1],
    ];
    let isValid = false;
    let opponent = turn === "B" ? "W" : "B";

    for (let delta of deltas) {
        let xDelta = delta[0];
        let yDelta = delta[1];

        if (
            0 <= x + xDelta &&
            x + xDelta <= 7 &&
            0 <= y + yDelta &&
            y + yDelta <= 7 &&
            board[8 * (y + yDelta) + (x + xDelta)] === opponent
        ) {
            let m = 2;

            while (
                0 <= x + xDelta * m &&
                x + xDelta * m <= 7 &&
                0 <= y + yDelta * m &&
                y + yDelta * m <= 7
            ) {
                let nextSquareIndex = 8 * (y + yDelta * m) + (x + xDelta * m);

                if (board[nextSquareIndex] === opponent) {
                    m++;
                    continue;
                } else if (board[nextSquareIndex] === turn) {
                    isValid = true;
                    break;
                } else if (board[nextSquareIndex] === null) {
                    break;
                }
            }
        }

        if (isValid) {
            return isValid;
        }
    }
    return isValid;
}

function validMoves(board, turn) {
    let validMovesList = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(board, turn, [j, i])) {
                validMovesList.push([j, i]);
            }
        }
    }
    return validMovesList;
}

function makeMove(board, turn, [x, y]) {
    if (isValidMove(board, turn, [x, y])) {
        let deltas = [
            [1, 0],
            [-1, 0],
            [0, -1],
            [0, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
            [1, 1],
        ];
        let opponent = turn === "B" ? "W" : "B";

        for (let delta of deltas) {
            let xDelta = delta[0];
            let yDelta = delta[1];
            let squaresToChangeIndices = [];

            if (
                0 <= x + xDelta &&
                x + xDelta <= 7 &&
                0 <= y + yDelta &&
                y + yDelta <= 7 &&
                board[8 * (y + yDelta) + (x + xDelta)] === opponent
            ) {
                squaresToChangeIndices.push(8 * (y + yDelta) + (x + xDelta));
                let m = 2;

                while (
                    0 <= x + xDelta * m &&
                    x + xDelta * m <= 7 &&
                    0 <= y + yDelta * m &&
                    y + yDelta * m <= 7
                ) {
                    let nextSquareIndex =
                        8 * (y + yDelta * m) + (x + xDelta * m);

                    if (board[nextSquareIndex] === opponent) {
                        squaresToChangeIndices.push(nextSquareIndex);
                        m++;
                        continue;
                    } else if (board[nextSquareIndex] === turn) {
                        board[8 * y + x] = turn;
                        for (let index of squaresToChangeIndices) {
                            board[index] = turn;
                        }
                        break;
                    } else if (board[nextSquareIndex] === null) {
                        break;
                    }
                }
            }
        }
    }
}

function countScore(board, player) {
    let total = 0;
    for (let square of board) {
        if (square === player) {
            total += 1;
        }
    }
    return total;
}

function appEvaluateBoard(board, player) {
    let score = 0;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === player) {
            score++;
        } else if (board[i] !== null) {
            score--;
        }
    }
    return score;
}

function alphaBeta(board, depth, alpha, beta, maximizingPlayer, player) {
    if (depth === 0 || validMoves(board, player).length === 0) {
        return appEvaluateBoard(board, player);
    }

    let opponent = player === "B" ? "W" : "B";

    if (maximizingPlayer) {
        let maxAppEval = -Infinity;
        for (let move of validMoves(board, player)) {
            let newBoard = board.slice();
            makeMove(newBoard, player, move);
            let appEval = alphaBeta(
                newBoard,
                depth - 1,
                alpha,
                beta,
                false,
                player
            );
            maxAppEval = Math.max(maxAppEval, appEval);
            alpha = Math.max(alpha, appEval);
            if (beta <= alpha) {
                break;
            }
        }
        return maxAppEval;
    } else {
        let minAppEval = Infinity;
        for (let move of validMoves(board, opponent)) {
            let newBoard = board.slice();
            makeMove(newBoard, opponent, move);
            let appEval = alphaBeta(
                newBoard,
                depth - 1,
                alpha,
                beta,
                true,
                player
            );
            minAppEval = Math.min(minAppEval, appEval);
            beta = Math.min(beta, appEval);
            if (beta <= alpha) {
                break;
            }
        }
        return minAppEval;
    }
}

function getBestMove(board, player, difficulty) {
    let bestMove = null;
    let bestValue = -Infinity;
    let depth = difficulty === "easy" ? 1 : difficulty === "medium" ? 3 : 5;

    for (let move of validMoves(board, player)) {
        let newBoard = board.slice();
        makeMove(newBoard, player, move);
        let movappEvalue = alphaBeta(
            newBoard,
            depth,
            -Infinity,
            Infinity,
            false,
            player
        );
        if (movappEvalue > bestValue) {
            bestValue = movappEvalue;
            bestMove = move;
        }
    }

    return bestMove;
}
