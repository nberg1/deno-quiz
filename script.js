// Function to load a new question from the server
async function loadQuestion() {
    try {
        // fetch the question from the server
        const response = await fetch("/question");
        const data = await response.json();

        // Display the question
        const questionElement = document.querySelector(".question");
        questionElement.textContent = data.question;

        // Display the answer options
        const answersContainer = document.querySelector(".answers");
        answersContainer.innerHTML = "";
        data.answers.forEach((answer, index) => {
            const button = document.createElement("button");
            button.textContent = answer;
            button.onclick = () => checkAnswer(index, data.correct);
            answersContainer.appendChild(button);
          });
    } catch (error) {
        console.error("Error fetching question:", error);
        const questionElement = document.querySelector(".question");
        questionElement.textContent = "Failed to load question. Please try again.";
    }
}

function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
      alert("✅ Correct!");
      loadQuestion();
    } else {
      alert("❌ Wrong! Try again.");
    }
  }
  
// Load the first question when the page is ready
window.onload = loadQuestion;

