# AssignmentHub

AssignmentHub is a web-based student assignment management and directory application built for COMP 2068 Assignment 2.

The application allows users to register, log in, authenticate with GitHub, and manage their assignments using full CRUD functionality.

## Features

* User registration
* Local authentication
* GitHub authentication
* Login and logout
* Public read-only assignment directory
* Create assignments
* View assignments
* Edit assignments
* Delete assignments
* Delete confirmation
* Assignment priority
* Assignment status
* Due dates
* Responsive professional design

## Additional Feature

### Keyword Search

The additional feature implemented for this project is keyword search.

Visitors can search the public assignment directory using keywords. The search checks assignment titles, courses, descriptions, priorities, and statuses.

This allows users to find relevant assignments more quickly and improves the usability of the public directory.

## Technologies

* Node.js
* Express.js
* Express Generator
* Handlebars (HBS)
* MongoDB Atlas
* Mongoose
* Passport.js
* Passport Local
* Passport GitHub
* Express Session
* Bootstrap
* CSS
* Git
* GitHub
* Render

## Live Application

[INSERT YOUR RENDER URL HERE]

## GitHub Repository

[INSERT YOUR GITHUB REPOSITORY URL HERE]

## Database

MongoDB Atlas is used to store users and assignments.

Database credentials and authentication secrets are stored using environment variables and are not committed to the repository.

## Authentication

Users can register and log in using local authentication or use their GitHub account to authenticate.

## CRUD

Authenticated users can create, view, edit, and delete their own assignments.

Delete operations include a confirmation page before the assignment is permanently removed.
