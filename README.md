# Angular State Management

## This Repo

This is a mono-repo for all the code we will work with and create during the class. You should put it on your github account so you have it available after the class is over. [instructions](./notes/putting-your-repo-on-github.md)

## Layout

- `labs` - This will hold the text of the labs. These will be provided to you as we work through the course materials.
- `notes` - A place for your notes. Jeff will put his notes in this directory, too and show you how to get copies of his notes as he goes.
- `src` - The source code we will work with in this course.
    - `lab` - Weird to have this nested, but there may be other things we add to `src` as we go.
        - `backend` A .NET HTTP API, prepared for this course. Includes SSE. If you run it (`cd src/lab/backend/Backend.Api/ && dotnet run`) the default route shows a Scalar API reference (based on the open api spec) [Scalar API Doc](http://localhost:5261)
        - `frontend` The "starter" for the labs we will do together. Pretty much want to stay out of this project if you aren't working on the labs. [http://localhost:4200](http://localhost:4200)
        - `demos` A stripped down mirror of the labs project. [http://localhost:4201](http://localhost:4201) This will be a "Scratch pad" for trying out various things.

## Important Notes

**ALWAYS use a unique instance of VSCode for each Angular application. the `.vscode/` directory `package.json` and `angular.json` *must* be in the root of the open project**

The instructor will give you instructions on using the classroom-sync extension. Make sure you follow that part, even if you don't think you'll need it.

## Is Classroom Sync Configured

- this is the IP: 172.30.176.1