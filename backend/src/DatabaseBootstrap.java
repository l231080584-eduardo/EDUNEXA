import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.nio.file.Files;
import java.nio.file.Path;

/** Creates the application's database after SQL Server accepts connections. */
public final class DatabaseBootstrap {
    private DatabaseBootstrap() {}

    public static void main(String[] args) throws InterruptedException {
        String host = System.getenv().getOrDefault("DB_HOST", "db");
        String port = System.getenv().getOrDefault("DB_PORT", "1433");
        String user = System.getenv().getOrDefault("DB_USER", "sa");
        String password = System.getenv().getOrDefault("DB_PASSWORD", "Upiicsa1");
        String database = System.getenv().getOrDefault("DB_NAME", "ENUDEXA_DB").replace("]", "]]");
        String url = "jdbc:sqlserver://" + host + ":" + port
                + ";databaseName=master;encrypt=false;trustServerCertificate=true;loginTimeout=5";

        for (int attempt = 1; attempt <= 90; attempt++) {
            try (Connection connection = DriverManager.getConnection(url, user, password);
                 Statement statement = connection.createStatement()) {
                statement.execute("IF DB_ID(N'" + database.replace("'", "''")
                        + "') IS NULL CREATE DATABASE [" + database + "]");
                break;
            } catch (Exception exception) {
                if (attempt == 90) {
                    throw new IllegalStateException("SQL Server no quedó disponible tras varios reintentos.", exception);
                }
                Thread.sleep(2000);
            }
        }
        initializeSchema(database, user, password, host, port);
        System.out.println("Base de datos ENUDEXA_DB inicializada.");
    }

    private static void initializeSchema(String database, String user, String password, String host, String port) {
        String url = "jdbc:sqlserver://" + host + ":" + port
                + ";databaseName=" + database + ";encrypt=false;trustServerCertificate=true;loginTimeout=5";
        try {
            String script = Files.readString(Path.of("/app/init.sql"));
            String[] batches = script.split("(?im)^\\s*GO\\s*(?:--.*)?$");
            try (Connection connection = DriverManager.getConnection(url, user, password);
                 Statement statement = connection.createStatement()) {
                for (String batch : batches) {
                    if (!batch.isBlank()) statement.execute(batch);
                }
            }
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible ejecutar backend/init.sql.", exception);
        }
    }
}
