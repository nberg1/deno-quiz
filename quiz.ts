// Fetch data from external API
const fetchData = async () => {
    const response = await fetch("https://randomuser.me/api/?results=5");
    if (!response.ok) {
        console.error("Failed to fetch data", response.statusText);
        return [];
    }
    const data = await response.json();
    return data.results.map((user: any) => ({
        name: `${user.name.first} ${user.name.last}`,
        email: user.email,
    }));
};

// Process and save data
const saveData = async () => {
    const users = await fetchData();
    if (users.length === 0) {
        console.log("No data to save.");
        return;
    }

    // Format data as a string
    const formattedData = users
    .map((user: any) => `Name: ${user.name}, Email: ${user.email}`)
    .join("\n");

    console.log("Fetched Users:\n", formattedData);

    // Save to a file
    const filePath = "./users.txt";
    await Deno.writeTextFile(filePath, formattedData);
    console.log(`Data saved to ${filePath}`);
};

// Run the script
await saveData();