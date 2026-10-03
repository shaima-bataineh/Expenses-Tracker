const expenseForm = document.getElementById("expenseForm");
let allExpenses =[];
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

// darkmodebutton
const darkModeBtn = document.getElementById("darkModeBtn");
darkModeBtn.addEventListener("click", function(){
    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        darkModeBtn.textContent = "Light Mode";
        
    }else{
        darkModeBtn.textContent = "Dark Mode";
        
    }
});

// chart 
const expenseChart = document.getElementById("expenseChart");
let chart;
function getExpensesByCategory(expenses){
    const categoryTotals = {};
    expenses.forEach(function(expense){
        if(!categoryTotals[expense.category]){
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += Number(expense.amount);
    });
    return categoryTotals;
}

function updateChart(expenses){
    const categoryTotals = getExpensesByCategory(expenses);

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if(chart){
        chart.destroy(); // delete old chart before create new chart
    
    }

    chart = new Chart(expenseChart,{
        type: "bar",
        data:{
            labels: labels,
            datasets:[{
                label: "Expenses",
                data: values
            }]
        },
        options:{
            responsive: true,
        }
    });
}

// alert message
const alertContainer = document.getElementById("alertContainer");

function showAlert(message, type){
    const alert = document.createElement("div");
    alert.classList.add("alert",`alert-${type}`);
    alert.textContent =message;
    alertContainer.innerHTML = "";
    alertContainer.appendChild(alert);

    //time alert
setTimeout(function(){
    alert.remove();
}, 3000);

}

expenseForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // prevent defualt behavior to form html (prevent refresh page)

    const title = titleInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    if (title === "") {
        showAlert("Title is required", "danger");
        return;
    }
    if (isNaN(amount) || amount <= 0) {

        showAlert("Amount should be a number greater than 0 ", "danger");
        return;
    }
    if (category === "") {
        showAlert("Category is required","danger");
        return;
    }
    if (date === "") {
        showAlert("Date is required","danger");
        return;
    }

    const expenseData = {
        title: title,
        amount: amount,
        category: category,
        date: date
    };

    // post request
    try {
        const response = await fetch("http://localhost:3000/api/expenses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // tell server that data is a JSON
            },
            body: JSON.stringify(expenseData) // data after convert to JSON
        });

        if (!response.ok) {
            const errorData = await response.json();
            showAlert(errorData.message,"danger");
            return;
        }

        showAlert("Expense added successfully: ","success");
        await loadExpenses();
        expenseForm.reset();// reset input (form)
    } catch (error) {
        showAlert("An error occurred while adding the expense.", "danger");
    }
});

const expenseTableBody = document.getElementById("expenseTableBody");
const categoryFilter =document.getElementById("categoryFilter");

//spinner
const loadingSpinner = document.getElementById("loadingSpinner");
categoryFilter.addEventListener("change", function(){
    const selectedCategory = categoryFilter.value;

    if(selectedCategory === "All"){
        renderExpenses(allExpenses);
        return;
    }
    const filteredExpenses = allExpenses.filter(function(expense){
        if(expense.category === selectedCategory)
            return true;
    
    });
    renderExpenses(filteredExpenses);
})
// var to summary cards
const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const highestExpense = document.getElementById("highestExpense");

//fun calculate summary card
function updateSummary(data){
    const total = data.reduce(function(sum, expense){ // reduce take value group then convert to 1 value(this like sum value)
        return sum + Number(expense.amount);
    },0); // 0 Initial value to sum

    // count of expenses
    const count = data.length;
    const highest = data.length >0 
    ? Math.max(...data.map(function(expense){ // max expense use map to convert data to amount
        return Number(expense.amount);
    }))
    :0; // if list empty make value 0

    // display result in cards
    totalAmount.textContent =total.toFixed(2);
    expenseCount.textContent =count;
    highestExpense.textContent = highest.toFixed(2);
}
const editExpenseModalElement = document.getElementById("editExpenseModal");

const editExpenseForm = document.getElementById("editExpenseForm");

const editTitleInput = document.getElementById("editTitle");
const editAmountInput = document.getElementById("editAmount");
const editCategoryInput = document.getElementById("editCategory");
const editDateInput = document.getElementById("editDate");

const editExpenseModal = new bootstrap.Modal(editExpenseModalElement);

let editingExpenseId = null;

//edit form submit
editExpenseForm.addEventListener("submit",async function(event) {
    event.preventDefault();
    
    const title = editTitleInput.value;
    const amount = Number(editAmountInput.value);// want br number case input return str even that is a number "9"
    const category = editCategoryInput.value;
    const date = editDateInput.value;

    // validation 
    if(title === ""){
        showAlert("Title is required","danger");
        return;
    }

    // amount 
    if(isNaN(amount)||amount <= 0){
        showAlert("Amount should be a number greater than 0","danger");
        return;
    }
    
    //category
    if(category === ""){
        showAlert("Enter Category their is required","danger");
        return;
    }

    //date
    if(date === ""){
        showAlert("Missed date is required","danger");
        return;
    }

    const expenseData ={
        title,
        amount,
        category,
        date
    };

    //send to api

    try{
        const response = await fetch(`http://localhost:3000/api/expenses/${editingExpenseId}`,
            {
                method: "PUT",
                headers:{
                    "Content-Type": "application/json"
                },
                body:JSON.stringify(expenseData)
            }
        );
        if(!response.ok){
            const errorData = await response.json();
            showAlert(errorData.message,"danger");
            return;
        }

        showAlert("Expense updated successfully","success");
        editExpenseModal.hide();
        await loadExpenses();

    }catch(error){
        showAlert("Could not connect to server","danger");
    }
});


function renderExpenses(expenses) {
expenseTableBody.innerHTML = "";
    expenses.forEach(function (expense) {
        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        titleCell.textContent = expense.title;
        row.appendChild(titleCell);

        const amountCell = document.createElement("td");
        amountCell.textContent = expense.amount;
        row.appendChild(amountCell);

        const categoryCell = document.createElement("td");
        const categoryBadge = document.createElement("span");
        categoryBadge.classList.add("badge","category-badge",
            expense.category.toLowerCase()
        );

        categoryBadge.textContent = expense.category;
        categoryCell.appendChild(categoryBadge);
        row.appendChild(categoryCell);

        const dateCell = document.createElement("td");
        dateCell.textContent = expense.date;
        row.appendChild(dateCell);


        // Actioncell
        const actionCell = document.createElement("td");
        actionCell.classList.add("actions-cell");
        // edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.classList.add("btn", "edit-btn","me-2");

        //function editexpens
        editButton.addEventListener("click", function(){
            editingExpenseId = expense.id;// Store the ID of the record to update when Save is clicked
            editTitleInput.value =expense.title;
            editAmountInput.value = expense.amount;
            editCategoryInput.value = expense.category;

            const[day, month, year] = expense.date.split("-");

            editDateInput.value =`${year}-${month}-${day}`;
            editExpenseModal.show();
        });
        actionCell.appendChild(editButton);

        // remove button
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.classList.add("btn", "remove-btn");

        removeButton.addEventListener("click",async function() {
            try{
                const response = await fetch(`http://localhost:3000/api/expenses/${expense.id}`,
                    {
                        method: "DELETE"
                    }
                );

                if(!response.ok){
                    const errorData = await response.json();
                    showAlert(errorData.message,"danger");
                    return;
                }
                //const data = await response.json();
                showAlert("Expense deleted successfully", "success");
                await loadExpenses();// get list agin from server 
            }catch(error){

                showAlert("Could not connect to server","danger");

            }
            
        });

        actionCell.appendChild(removeButton);

        // add action cell to row
        row.appendChild(actionCell);
        expenseTableBody.appendChild(row);
    });
}

// get
async function loadExpenses() {

 try{
    loadingSpinner.classList.remove("d-none");

    const response = await fetch("http://localhost:3000/api/expenses",{
        cache: "no-store" // prevent cache data
    });

    if(!response.ok){
        const errorData = await response.json();
        showAlert(errorData.message, "danger");
        return;
    }

    const data = await response.json();
    allExpenses = data;
    updateSummary(data);
    updateChart(data);
    // know choose not give all data
    const selectedCategory = categoryFilter.value;
    if(selectedCategory === "All"){
        renderExpenses(allExpenses);
    }else{
        const filteredExpenses = allExpenses.filter(function(expense){
            return expense.category === selectedCategory;
        });
        renderExpenses(filteredExpenses);
    }

}catch(error){

    showAlert("Could not connect to server", "danger");

}finally{
    loadingSpinner.classList.add("d-none");
}
}
loadExpenses();


