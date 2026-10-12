import jenkins.model.Jenkins
import com.cloudbees.plugins.credentials.CredentialsScope
import com.cloudbees.plugins.credentials.SystemCredentialsProvider
import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.plugins.credentials.SecretBytes
import org.jenkinsci.plugins.plaincredentials.impl.FileCredentialsImpl
import java.nio.charset.StandardCharsets

try {
    def envLines = [
        "DB_USER=playlist",
        "DB_PASSWORD=playlist_secret_pass",
        "DB_NAME=playlisthub",
        "TAG=1"
    ]
    def envContent = envLines.join("\n") + "\n"
    
    def domain = Domain.global()
    def store = Jenkins.instance.getExtensionList(SystemCredentialsProvider.class)[0].getStore()
    def existing = store.getCredentials(domain).find { it.id == "playlisthub-env" }
    
    def secretBytes = SecretBytes.fromBytes(envContent.getBytes(StandardCharsets.UTF_8))
    def credentials = new FileCredentialsImpl(
        CredentialsScope.GLOBAL,
        "playlisthub-env",
        "PlaylistHub production environment secrets",
        ".env",
        secretBytes
    )
    
    if (existing != null) {
        store.updateCredentials(domain, existing, credentials)
        println("=== [INIT] Updated playlisthub-env credential successfully ===")
    } else {
        store.addCredentials(domain, credentials)
        println("=== [INIT] Added playlisthub-env credential successfully ===")
    }
} catch (Exception e) {
    println("=== [INIT] Error adding playlisthub-env: " + e.getMessage() + " ===")
    e.printStackTrace()
}
