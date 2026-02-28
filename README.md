

This is a backend web service designed to consolidate customer contact information across multiple purchases. It identifies if a customer is returning using a different email or phone number and links those records together into a single "Identity Cluster."

## 🚀 Live Link
**Public Endpoint:** [PASTE_YOUR_RENDER_URL_HERE]/identify

## 🛠 Tech Stack
- **Backend:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Hosted via Neon.tech)
- **ORM:** Prisma
- **Deployment:** Render

## 📋 Key Features
- **Automatic Linking:** Links new contact info to existing records via common email or phone number.
- **Primary vs. Secondary:** Automatically designates the oldest record as "primary" and newer ones as "secondary."
- **Cluster Merging:** Handles complex cases where a new order bridges two previously separate primary accounts, merging them into one.
- **Deduplication:** Prevents creating redundant secondary records if the information is already known.



## 📖 API Usage

### Identify Customer
**POST** `/identify`

**Request Body:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
