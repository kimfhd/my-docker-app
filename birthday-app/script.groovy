def buildImage(){
    echo "building the docker image.."
    withCredentials([usernamePassword(credentialsId: 'aliyun-repo',passwordVariable:'PASS',usernameVariable:'USER')]){
        sh "docker build -t crpi-2mqcyvq6hy3lunzv.cn-hangzhou.personal.cr.aliyuncs.com/birthday-server/birthday-app:2.6 ."
        sh "echo $PASS | docker login -u $USER --password-stdin crpi-2mqcyvq6hy3lunzv.cn-hangzhou.personal.cr.aliyuncs.com"
        sh "docker push crpi-2mqcyvq6hy3lunzv.cn-hangzhou.personal.cr.aliyuncs.com/birthday-server/birthday-app:2.6"
    }
}
def deployApp(){
    echo 'deploying the application...'
}
return this