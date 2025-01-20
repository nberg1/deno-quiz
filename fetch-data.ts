const API_KEY = "e8eed9f4eb9ee1be15dbaf4e718757d4";

interface Movie {
    id: number;
    title: string;
    [key: string]: any;
}

interface Actor {
    id: number;
    name: string;
    known_for: Movie[];
    profile_path: string;
}

interface MovieCredit {
    id: number;
    cast: any[];
}

interface MovieData {
    actors: any[];
    movieCredits: Map<number, any>;
}

// Fetch actors data from TMDb API
const fetchActorData = async(endpoint: string): Promise<any[]> => {
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error("Failed to fetch data from database");
    }
    const data = await response.json();
    return data.results;
};

// Fetch movie credits data from TMDb API
const fetchMovieCreditsData = async(endpoint: string): Promise<any> => {
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error("Failed to fetch data from database");
    }
    const data = await response.json();
    return data;
};

// Main function to fetch data
export const fetchData = async (): Promise<MovieData | undefined> => {
    try {        
        const numPages = 20;
        let actors: any[] = [];
        let allActors: any[] = [];
        let movieMap = new Map();
        // first fetch the actors to get some of the movies they are known for
        console.log("Fetching actor data...");
        for (let pageIndex = 1; pageIndex <= numPages; pageIndex++) {
            actors.push(await fetchActorData(`https://api.themoviedb.org/3/person/popular?page=${pageIndex}&api_key=${API_KEY}`));
        }

        actors.forEach((actorSet) => {
            allActors = allActors.concat(actorSet);
        })        

        // go through each of the actors and add each of the known movies to a movie map if not already there
        allActors.forEach((actor) => {
            actor.known_for.forEach((media: any) => {
                if (media.media_type == "movie") {
                    // get the movie id
                    const movieId = media.id;
                    if (!movieMap.get(movieId)) {
                        movieMap.set(movieId, {movieTitle: media.title, allActors: []});
                    }
                }
            })            
        });
    
        console.log("Fetching movie credits data...");
        // go through movieMap keys and fetch movie credits data for each of the movies in the map
        for(const movieId of Array.from( movieMap.keys()) ) {
            const movieCredit: MovieCredit = await fetchMovieCreditsData(`https://api.themoviedb.org/3/movie/${movieId.toString()}/credits?language=en-US&api_key=${API_KEY}`);
            movieCredit.cast.forEach((credit) => {
                if (credit.character) {
                    movieMap.get(movieId).allActors.push({id: credit.id, name: credit.name});
                }
            });
        }

        console.log("Data preparation complete!");
        const movieData: MovieData = {
            actors: allActors,
            movieCredits: movieMap
        };
        return movieData;
    } catch (error: any) {
        console.log("Error: ", error.message);
        return;
    }
};

// Function to generate a quiz quetion
export const generateQuestion = async (): Promise<any> => {
    const movieData = await fetchData();
    const actors = movieData?.actors;
    const movieCredits = movieData?.movieCredits;

    // choose random actor from actors list
    const correctActor = actors?.[Math.floor(Math.random() * actors.length)];
    console.log(correctActor);

    // pick 3 movies the actor has played in
    let selectedMovies: string[] = [];
    let selectedMovieIds: number[] = [];
    correctActor.known_for.forEach((movie: any) => {
        selectedMovies.push(movie.title);
        selectedMovieIds.push(movie.id);
    });

    // Find other actors from the selected movies
    let actorMap: Map<string, number> = new Map();
    const potentialWrongActors: string[] = [];
    for (const movieId of selectedMovieIds) {
        const actorOptions = movieCredits?.get(movieId).allActors;
        actorOptions.forEach((actor: any) => {
            if (actorMap.has(actor.name)) {
                actorMap.set(actor.name, actorMap.get(actor.name) + 1);
            } else {
                actorMap.set(actor.name, 1);
            }
        })
    }

    // console.log(actorMap);

    // get all actors from actor map where their occurrences are less than 3
    // takes care of edge case where there is a possibility more than 1 actor is in all three movies
    actorMap.forEach((value, key) => {
        if (value < 3) {
            potentialWrongActors.push(key);
        }
    });

    // pop 3 random ones out and they will be the potential wrong actors
    const shuffledWrongActors = potentialWrongActors.sort(() => Math.random() - 0.5).slice(0, 3);

    // prepare final options
    const allOptions = [...shuffledWrongActors, correctActor.name].sort(() => Math.random() - 0.5);

    console.log("Correct Actor:", correctActor.name);
    console.log("Selected Movies:", selectedMovies);
    console.log("Wrong Actors:", shuffledWrongActors);
    // Construct the quiz question
    return {
        question: `Which actor played in all three movies: "${selectedMovies[0]}", "${selectedMovies[1]}", and "${selectedMovies[2]}"?`,
        answers: allOptions,
        correct: allOptions.indexOf(correctActor.name),
    };
};