# Google Play release information

## App identity

- App name: Institute User
- Package name: com.institute.user
- Version name: 1.0
- Version code: 1
- Category: Education

## Store listing

Short description:

> School services for students, parents, staff, and transport teams.

Full description:

> Institute User connects students, parents, staff, and transport teams with essential school services. View homework, attendance, timetables, marks, fees, holidays, study materials, leave information, and institute notifications from one secure application. Authorized transport users can share live bus location, while assigned students can view the latest available bus position.

## Play Console declarations

- The app requires an account supplied by a participating institute.
- Provide Google review credentials for each applicable user role in App access.
- Declare collection of account identifiers, names, education records, files, notification tokens, and precise/approximate location as applicable.
- State that data is encrypted in transit and is not sold for advertising.
- Declare that location supports user-initiated live bus tracking.
- Complete the content-rating questionnaire as an education/school-management app.
- Set the target audience accurately. If children are included, complete Families policy declarations.
- Publish `/privacy-policy` from the production HTTPS web deployment and use that full URL in Play Console.

## Required account-owned items

- Complete Play developer identity and phone verification.
- Create the Play Console application with package `com.institute.user`.
- Enroll in Play App Signing.
- Upload the signed `app-release.aab`.
- Add a 512 x 512 store icon, 1024 x 500 feature graphic, phone screenshots, and support contact details.
- Run required internal/closed testing before production submission.
- Add Firebase `google-services.json` and native FCM integration before claiming lock-screen push support.

## Release build

Use Java 17 and run from `android`:

```powershell
$env:JAVA_HOME='C:\Users\banda\.jdks\corretto-17.0.20'
.\gradlew.bat bundleRelease
```

Back up `android/release-upload-key.jks` and `android/keystore.properties` securely. Losing the upload key or password can prevent future updates.
