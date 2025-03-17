-- Création de la base de données
CREATE DATABASE basebraindb;

-- Utilisation de la base de données
USE basebraindb;

-- Création de la table users
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('professor', 'student') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    UNIQUE KEY (email)
);

-- Création de la table exercises
CREATE TABLE exercises (
    id INT(11) NOT NULL AUTO_INCREMENT,
    professor_id INT(11) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    correction_model TEXT DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_exercises_professor FOREIGN KEY (professor_id) REFERENCES users(id)
);

-- Création de la table submissions
CREATE TABLE submissions (
    id INT(11) NOT NULL AUTO_INCREMENT,
    student_id INT(11) NOT NULL,
    exercise_id INT(11) NOT NULL,
    content VARCHAR(255) NOT NULL,
    correction_model TEXT DEFAULT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_submissions_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);


CREATE TABLE corrections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255),  -- Chemin du fichier de correction (si applicable)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE correction_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  correction_id INT NOT NULL,
  file_url TEXT NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  description TEXT,
  configuration JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE
);