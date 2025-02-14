// Usually would not add this to github but for the purpose of this project, will keep for now
// so that anyone running this application doesn't need to get one of their own.
const API_KEY = "YOUR_API_KEY";

interface MovieCredit {
    id: number;
    cast: any[];
}

interface MovieData {
    movieCredits: Map<number, any>;
    correctActor: any;
    actorMovies: any[];
}

let usedActors: any[] = [];

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
        const numPages = 12;
        const actors: any[] = [];
        let allActors: any[] = [];
        const movieMap = new Map();
        // first fetch the actors to get some of the movies they are known for
        console.log("Fetching actor data...");
        for (let pageIndex = 1; pageIndex <= numPages; pageIndex++) {
            actors.push(await fetchActorData(`https://api.themoviedb.org/3/person/popular?page=${pageIndex}&api_key=${API_KEY}`));
        }

        // get all the actors
        actors.forEach((actorSet) => {
            allActors = allActors.concat(actorSet);
        })        

        let actorMeetsCriteria = false;
        let correctActor;
        while (!actorMeetsCriteria) {
            // choose random actor from actors list
            correctActor = allActors?.[Math.floor(Math.random() * allActors.length)];

            let movieCount = 0;
            // check their know fors original language
            correctActor.known_for.forEach((media: any) => {
                if (media.media_type == "movie" && media.original_language == "en") {
                    movieCount += 1;
                }
            });
            // if all 3 movies are english movies, let's assume its a US actor
            if (movieCount == 3) {
                actorMeetsCriteria = true;
            }
            // make sure not already used actor
            const correctActorId = correctActor.id;
            const alreadyUsedActor = usedActors.some((actor) => actor.id === correctActorId);
            if (alreadyUsedActor) {
                actorMeetsCriteria = false;
            }
        }
        // mark actor as used to not randomly choose them again
        usedActors.push(correctActor);

        // make api call to get people movie credit
        // do the movie credit mapping 
        console.log("Fetching movie credits data...");
        for (let i = 0; i < correctActor.known_for.length; i++) {
            const currentMovie = correctActor.known_for[i];
            movieMap.set(currentMovie.id, {movieTitle: currentMovie.title, allActors: []})
            const movieCredit: MovieCredit = await fetchMovieCreditsData(`https://api.themoviedb.org/3/movie/${currentMovie.id.toString()}/credits?language=en-US&api_key=${API_KEY}`);
            movieCredit.cast.forEach((credit) => {
                if (credit.character) {
                    movieMap.get(currentMovie.id).allActors.push({id: credit.id, name: credit.name});
                }
            });
        }

        console.log("Data preparation complete!");
        const movieData: MovieData = {
            movieCredits: movieMap,
            correctActor: correctActor,
            actorMovies: correctActor.known_for
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
    const movieCredits = movieData?.movieCredits;
    const correctActor = movieData?.correctActor;
    const actorMovies = movieData?.actorMovies;

    // pick 3 movies the actor has played in
    const selectedMovies: string[] = [];
    const selectedMovieIds: number[] = [];
    actorMovies?.forEach((movie: any) => {
        selectedMovies.push(movie.title);
        selectedMovieIds.push(movie.id);
    });

    // Find other actors from the selected movies
    const actorMap: Map<string, number> = new Map();
    const potentialWrongActors: string[] = [];
    for (const movieId of selectedMovieIds) {
        const actorOptions = movieCredits?.get(movieId).allActors;
        actorOptions.forEach((actor: any) => {
            if (actor.name != correctActor.name) {
                if (actorMap.has(actor.name)) {
                    actorMap.set(actor.name, actorMap.get(actor.name) + 1);
                } else {
                    actorMap.set(actor.name, 1);
                }
            }

        })
    }

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

    // Construct the quiz question
    return {
        question: `Which actor played in all three movies: "${selectedMovies[0]}", "${selectedMovies[1]}", and "${selectedMovies[2]}"?`,
        answers: allOptions,
        correct: allOptions.indexOf(correctActor.name),
    };
};
