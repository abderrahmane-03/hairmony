pipeline {
    agent any
    stages {
        stage('Clone Repository') {
            steps {
                git 'https://github.com/abderrahmane-03/pigeonDeployment.git'
            }
        }
        stage('Build') {
            steps {
                sh './mvnw clean package'
            }
        }
        stage('Docker Build & Deploy') {
            steps {
                sh 'docker build -t pigeonsky-app .'
                sh 'docker run -d -p 8443:8443 pigeonsky-app'
            }
        }
        stage('Test') {
            steps {
                sh './mvnw test'
            }
        }
    }
    post {
        always {
            junit 'target/surefire-reports/*.xml'
            mail to: 'developer@example.com',
                 subject: "Build ${currentBuild.fullDisplayName}",
                 body: "Check Jenkins for details."
        }
    }
}
