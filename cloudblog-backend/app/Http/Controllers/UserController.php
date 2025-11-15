<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;

class UserController extends Controller
{
    /**
     * Récupère la liste des utilisateurs avec filtres et pagination.
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {  
        $search = $request->query('search');
        $query = User::query();

        // 1. FILTRE PAR STATUT
        if ($request->has('status') && in_array($request->status, ['Active', 'Inactive'])) {
            $query->where('status', $request->status);
        }

        // 2. RECHERCHE PAR TERME
        if ($search) {
        // Convertissez le terme de recherche en minuscules
        $lowerSearch = strtolower($search);
        
        $query->where(function ($q) use ($lowerSearch) {
            // Appliquez LOWER() sur la colonne 'name' et comparez
            $q->whereRaw('LOWER(name) LIKE ?', ["%{$lowerSearch}%"])
            // Répétez pour l'email et toute autre colonne de recherche
            ->orWhereRaw('LOWER(email) LIKE ?', ["%{$lowerSearch}%"])
            ->orWhereRaw('LOWER(designation) LIKE ?', ["%{$lowerSearch}%"]);
        });
    }
        
        // On récupère les stats pour le dashboard
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'Active')->count();

        // 3. PAGINATION (Votre frontend utilise 8 par page)
        $users = $query->paginate(8);

        return response()->json([
            'users' => $users->items(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'total' => $users->total(),
            'stats' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'inactive_users' => $totalUsers - $activeUsers,
            ]
        ]);
    }

    /**
     * Créer un nouvel utilisateur.
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            // L'email doit être unique au moment de la création
            'email' => 'required|string|email|max:255|unique:users', 
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['User', 'Admin'])],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
            'designation' => 'nullable|string|max:255',
            'image' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
            'designation' => $request->designation,
            'image' => $request->image,
            // Les champs 'created_at' et 'updated_at' sont gérés par Eloquent (via $table->timestamps())
            // 'dateInscription' est 'created_at' dans la BDD.
        ]);

        return response()->json($user, 201);
    }

    /**
     * Afficher les détails d'un utilisateur spécifique.
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(User $user)
    {
        return response()->json($user);
    }

    /**
     * Mettre à jour un utilisateur existant.
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            // L'email doit être unique, SAUF pour l'utilisateur actuel
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            // Le mot de passe est optionnel si l'utilisateur est édité
            'password' => 'nullable|string|min:8', 
            'role' => ['required', Rule::in(['User', 'Admin'])],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
            'designation' => 'nullable|string|max:255',
            'image' => 'nullable|string|max:255',
        ]);

        $userData = $request->only(['name', 'email', 'role', 'status', 'designation', 'image']);

        if ($request->has('password') && !empty($request->password)) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        return response()->json($user);
    }

    /**
     * Supprimer un utilisateur.
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(null, 204);
    }
    
    /**
     * Changer le statut (Active/Inactive) de l'utilisateur.
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus(User $user)
    {
        $newStatus = $user->status === 'Active' ? 'Inactive' : 'Active';
        $user->status = $newStatus;
        $user->save();

        return response()->json(['id' => $user->id, 'status' => $newStatus]);
    }

    /**
     * Enregistrer la date de dernière connexion (utilisé lors d'une connexion réussie).
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function recordLogin(User $user)
    {
        $user->derniere_connexion = Carbon::now();
        $user->save();
        
        return response()->json(['message' => 'Login recorded']);
    }
}