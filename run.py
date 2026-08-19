from app import create_app

app = create_app()

if __name__ == '__main__':
    print("\n=======================================================")
    print(" PricePilot AI -- Live Application Server Starting")
    print(" Access Web Dashboard:  http://localhost:5000")
    print(" Access Swagger API:    http://localhost:5000/apidocs")
    print(" Access Health Probes:  http://localhost:5000/health")
    print("=======================================================\n")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
