# Firestore Question Data Fix

## Issue Fixed ✅

**Problem**: The question modal was showing placeholder text like "Option A (text missing)" instead of the actual question options and user's chosen answers from the Firestore database.

**Root Cause**: The code was only using the limited data stored in the test attempt document instead of fetching the complete question data from the Firestore database where the actual question content is stored.

## The Solution

### **1. Added Firestore Question Data Fetching** 🔍

**New Function: `fetchQuestionDetails()`**
```typescript
const fetchQuestionDetails = async (questionData: AttemptDoc['perQuestion'][0]) => {
  if (!questionData.chapterId || !questionData.qid) {
    console.warn('Missing chapterId or qid for question:', questionData);
    return null;
  }

  try {
    const chapter = questionData.chapterId;
    const qid = questionData.qid;
    const collName = `${chapter}-Test-Questions`;
    const ref = doc(db, 'Chapters', chapter, collName, qid);
    
    console.log(`Fetching question details from: Chapters/${chapter}/${collName}/${qid}`);
    
    const dataSnap = await getDoc(ref);
    if (dataSnap.exists()) {
      const questionDetails = dataSnap.data();
      return questionDetails;
    }
  } catch (error) {
    console.error('Error fetching question details:', error);
  }
  return null;
};
```

**Firestore Path Structure:**
```
Chapters/{chapterId}/{chapterId}-Test-Questions/{questionId}
```

### **2. Enhanced Question Modal** 📱

**Loading State:**
```typescript
{loadingQuestionDetails && (
  <div className="bg-blue-50 rounded-lg p-4">
    <div className="flex items-center space-x-2">
      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      <span className="text-blue-800">Loading question details...</span>
    </div>
  </div>
)}
```

**Real Question Text:**
```typescript
<LaTeXRenderer>
  {questionDetails?.questionText || questionDetails?.text || selectedQuestionData.questionText || 'Question text not available'}
</LaTeXRenderer>
```

**Real Options from Firestore:**
```typescript
{questionDetails?.choices && Array.isArray(questionDetails.choices) && questionDetails.choices.length > 0 && (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
    <div className="space-y-2">
      {questionDetails.choices.map((choice: any, index: number) => (
        <div key={index} className="flex items-start space-x-3">
          <span className="font-medium text-gray-600 min-w-[20px]">
            {String.fromCharCode(65 + index)}.
          </span>
          <div className="text-gray-700">
            <LaTeXRenderer>
              {typeof choice === 'string' ? choice : (choice?.text || choice?.content || `Option ${index + 1}`)}
            </LaTeXRenderer>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### **3. New User Answer Formatting** ✅

**Function: `formatUserResponseFromFirestore()`**
```typescript
const formatUserResponseFromFirestore = (questionData: AttemptDoc['perQuestion'][0], questionDetails: any) => {
  const response = questionData.response;
  const choices = questionDetails?.choices || [];
  
  // Helper function to get choice text by index
  const getChoiceByIndex = (index: number): string => {
    if (index < 0 || index >= choices.length) return `Option ${String.fromCharCode(65 + index)}`;
    const choice = choices[index];
    return typeof choice === 'string' ? choice : (choice?.text || choice?.content || `Option ${String.fromCharCode(65 + index)}`);
  };

  // Handle MCQ responses
  if (questionData.type === 'MCQ') {
    let choiceIndex: number;
    
    if (typeof response === 'number') {
      choiceIndex = response;
    } else if (response?.choiceIndex !== undefined) {
      choiceIndex = response.choiceIndex;
    }
    
    const choiceLetter = String.fromCharCode(65 + choiceIndex);
    const choiceText = getChoiceByIndex(choiceIndex);
    return `(${choiceLetter}) ${choiceText}`;
  }
  
  // Handle MultipleAnswer responses
  if (questionData.type === 'MultipleAnswer') {
    let choiceIndices: number[] = [];
    
    if (Array.isArray(response)) {
      choiceIndices = response;
    } else if (Array.isArray(response?.choiceIndices)) {
      choiceIndices = response.choiceIndices;
    }
    
    const selectedChoices = choiceIndices.map(index => {
      const choiceLetter = String.fromCharCode(65 + index);
      const choiceText = getChoiceByIndex(index);
      return `(${choiceLetter}) ${choiceText}`;
    });
    
    return selectedChoices.join(', ');
  }
  
  // Handle Numerical responses
  if (questionData.type === 'Numerical') {
    if (typeof response === 'string' || typeof response === 'number') {
      return String(response);
    } else if (response?.value !== undefined) {
      return String(response.value);
    }
  }
  
  return String(response);
};
```

### **4. Data Flow** 🔄

**Step 1: User clicks "View Full Question"**
```typescript
const openQuestionModal = async (questionData: AttemptDoc['perQuestion'][0]) => {
  setSelectedQuestionData(questionData);
  setShowQuestionModal(true);
  setQuestionDetails(null);
  
  // Fetch actual question details from Firestore
  const details = await fetchQuestionDetails(questionData);
  setQuestionDetails(details);
};
```

**Step 2: Fetch from Firestore**
- Path: `Chapters/{chapterId}/{chapterId}-Test-Questions/{questionId}`
- Gets: `{ questionText, choices: ["Option 1 text", "Option 2 text", ...], ... }`

**Step 3: Display Real Data**
- **Question**: Real question text from Firestore
- **Options**: Real option texts from Firestore choices array
- **User Answer**: User's stored response mapped to actual choice text

## Expected Results

### **Before Fix:**
- **Question**: Limited text from test attempt
- **Options**: A. Option A (text missing), B. Option B (text missing)...
- **User Answer**: (D) Option D

### **After Fix:**
- **Question**: Full question text from Firestore
- **Options**: A. A uniform circular disc placed on a frictionless horizontal plank..., B. [Real option 2 text]...
- **User Answer**: (D) [Real selected option text from Firestore]

## Testing

1. **Take a mock test** and submit it
2. **View test results** and click "View Full Question"
3. **Check loading state** → Should show spinner while fetching
4. **Check question text** → Should show complete question from Firestore
5. **Check options** → Should show actual option texts from database
6. **Check user answer** → Should show selected choice with real text

The fix ensures that all question data is retrieved from the authoritative Firestore database and displayed accurately, using the stored test attempt response to map to the correct choice text.
